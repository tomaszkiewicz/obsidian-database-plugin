import { Plugin, PluginSettingTab, Setting, App } from 'obsidian';
import { parseYaml } from 'obsidian';
import { MarkdownRenderChild } from "obsidian";
import Table from "./components/Table.vue";
import { mapSources, Row, Source } from './source';
import Vue from 'vue';
import vuetify from './vuetify'
import 'vuetify/dist/vuetify.min.css'
import { Field } from './field';

interface DatabasePluginSettings {
	globalIgnoreFilters: string[]
}

const DEFAULT_SETTINGS: DatabasePluginSettings = {
	globalIgnoreFilters: []
}

export default class DatabasePlugin extends Plugin {
	settings: DatabasePluginSettings;
	instances: any[]

	async onload() {
		await this.loadSettings();
		this.instances = [];

		this.addSettingTab(new DatabasePluginSettingTab(this.app, this))

		this.registerMarkdownCodeBlockProcessor(
			`databaseTable`,
			async (src, el, context) => {
				let parameters = parseYaml(src)

				const div = document.createElement("div");
				const child = new MarkdownRenderChild(div);

				if (parameters.include) {
					if (!Array.isArray(parameters.include)) {
						parameters.include = parameters.include.split(",")
					}

					for (let i of parameters.include) {
						let fm = this.app.metadataCache.getCache(i).frontmatter

						parameters = {
							...parameters,
							...fm,
						}
					}
				}

				while (!this.app.workspace.getActiveFile()) {
					await new Promise(resolve => setTimeout(resolve, 50));
				}

				const sources = mapSources(parameters.sources, this.app, this.settings.globalIgnoreFilters)
				const rows = (
					await Promise.all(sources.map((x: Source) => x.loadData()))
				).flat();

				for (let f of parameters.fields.filter((f: Field) => f.type == "link" && f.sources != null)) {
					const fieldSources = mapSources(f.sources, this.app, this.settings.globalIgnoreFilters)

					let autocomplete = (
						await Promise.all(fieldSources.map((x: Source) => x.loadData()))
					).flat().map((x: Row) => x._file.name.replace(".md", ""));

					f._sourceAutocomplete = autocomplete
				}

				const app = new Vue({
					vuetify,
					render: h => h(Table, {
						props: {
							...parameters,
							rows,
						}
					}),
				})
				this.instances.push(app)

				context.addChild(child)
				el.append(div)
				app.$mount(div);

				child.onunload = () => {
					this.instances = this.removeItemOnce(this.instances, app)
					app.$destroy();
				}
			}
		);
	}

	removeItemOnce(arr: Array<any>, value: any) {
		var index = arr.indexOf(value);
		if (index > -1) {
			arr.splice(index, 1);
		}
		return arr;
	}

	onunload() {
		this.instances.forEach(i => i.$destroy())
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class DatabasePluginSettingTab extends PluginSettingTab {
	constructor(app: App, private plugin: DatabasePlugin) {
		super(app, plugin);
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl('h2', { text: 'Database settings' });

		new Setting(containerEl)
			.setName('Global ignore list')
			.setDesc('Put a list of regexes, one per line, to ignore some of the files')
			.addTextArea(ta =>
				ta.setPlaceholder('Put regex to ignore fiels, one per line')
					.setValue(this.plugin.settings.globalIgnoreFilters.join('\n'))
					.onChange(async (value) => {
						this.plugin.settings.globalIgnoreFilters = value.split('\n');
						await this.plugin.saveSettings();
					}));
	}
}
