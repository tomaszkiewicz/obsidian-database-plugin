import { Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { parseFrontMatterStringArray } from 'obsidian';
import { parseYaml } from 'obsidian';
import { MarkdownPostProcessor, MarkdownRenderChild } from "obsidian";
import Table from "./components/Table.vue";
import { DirectorySource } from './source';
import Vue from 'vue';
import vuetify from './vuetify'
import Vuetify from "vuetify/lib"
import 'vuetify/dist/vuetify.min.css'

Vue.use(Vuetify)

interface DatabasePluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: DatabasePluginSettings = {
	mySetting: 'default'
}

export default class MyPlugin extends Plugin {
	settings: DatabasePluginSettings;
	instances: any[]

	async onload() {
		await this.loadSettings();
		this.instances = [];

		this.registerMarkdownCodeBlockProcessor(
			`databaseTable`,
			async (src, el, context) => {
				const parameters = parseYaml(src)

				const div = document.createElement("div");
				const child = new MarkdownRenderChild(div);

				const sources = parameters.sources.map((s: any) => {
					if (s.type == "directory") {
						return new DirectorySource(s.path, this.app.vault, this.app.metadataCache)
					}
				})

				const app = new Vue({
					vuetify,
					render: h => h(Table, {
						props: {
							...parameters,
							sources,
						}
					}),
				})
				this.instances.push(app)

				context.addChild(child)
				el.append(div)
				app.$mount(div);

				child.onunload = () => {
					console.log('child unload')
					app.$destroy();
				}
			}
		);

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('dice', 'Database Plugin', async (evt: MouseEvent) => {
			const ds = new DirectorySource("wines", this.app.vault, this.app.metadataCache)

			const files = this.app.vault.getFiles().filter(x => x.path.contains("wine"))

			files.forEach(async f => {
				// await ds.setData(f, "acidity", "dry")
				await ds.setLink(f, "strain", "Riesling")
			})
		});
		// Perform additional things with the ribbon
		ribbonIconEl.addClass('my-plugin-ribbon-class');

		// // This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		// const statusBarItemEl = this.addStatusBarItem();
		// statusBarItemEl.setText('Status Bar Text');

		// // This adds a simple command that can be triggered anywhere
		// this.addCommand({
		// 	id: 'open-sample-modal-simple',
		// 	name: 'Open sample modal (simple)',
		// 	callback: () => {
		// 		new SampleModal(this.app).open();
		// 	}
		// });
		// // This adds an editor command that can perform some operation on the current editor instance
		// this.addCommand({
		// 	id: 'sample-editor-command',
		// 	name: 'Sample editor command',
		// 	editorCallback: (editor: Editor, view: MarkdownView) => {
		// 		console.log(editor.getSelection());
		// 		editor.replaceSelection('Sample Editor Command');
		// 	}
		// });
		// // This adds a complex command that can check whether the current state of the app allows execution of the command
		// this.addCommand({
		// 	id: 'open-sample-modal-complex',
		// 	name: 'Open sample modal (complex)',
		// 	checkCallback: (checking: boolean) => {
		// 		// Conditions to check
		// 		const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
		// 		if (markdownView) {
		// 			// If checking is true, we're simply "checking" if the command can be run.
		// 			// If checking is false, then we want to actually perform the operation.
		// 			if (!checking) {
		// 				new SampleModal(this.app).open();
		// 			}

		// 			// This command will only show up in Command Palette when the check function returns true
		// 			return true;
		// 		}
		// 	}
		// });

		// // This adds a settings tab so the user can configure various aspects of the plugin
		// this.addSettingTab(new SampleSettingTab(this.app, this));

		// // If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// // Using this function will automatically remove the event listener when this plugin is disabled.
		// this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
		// 	console.log('click', evt);
		// });

		// // When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		// this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {
		console.log("onunload app")
		this.instances.forEach(i => i.$destroy())
		console.log("onunload app done")
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl('h2', { text: 'Settings for my awesome plugin.' });

		new Setting(containerEl)
			.setName('Setting #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					console.log('Secret: ' + value);
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}
