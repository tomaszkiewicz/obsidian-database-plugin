<template>
  <v-app>
    <Table
      :fields="finalParameters.fields"
      :groupBy="finalParameters.groupBy"
      :sortBy="finalParameters.sortBy"
      :rows="rows"
      :sources="sources"
      :key="rows.length"
      :urlBase="urlBase"
      @refresh="refresh"
    />
  </v-app>
</template>
<script lang="ts">
import Table from "./components/Table.vue";
import { Source, mapSources, Row } from "./source";
import { App, MetadataCache } from 'obsidian';
import { VApp } from "vuetify/lib";
import { Field } from "./field";

export default {
  name: "App",

  components: {
    Table,
    VApp,
  },

  data() {
    return {
      rows: [],
      sources: [],
      finalParameters: {},
    };
  },

  props: {
    app: App,
    parameters: {},
    settings: {},
    urlBase: String,
  },

  async created() {
    await this.refresh();
  },

  methods: {
    async refresh() {
      this.finalParameters = { ...this.parameters };

      if (this.finalParameters.include) {
        if (!Array.isArray(this.finalParameters.include)) {
          this.finalParameters.include = this.parameters.include.split(",");
        }

        for (let i of this.finalParameters.include) {
          let fm = this.app.metadataCache.getCache(i).frontmatter;

          this.finalParameters = {
            ...this.finalParameters,
            ...fm,
          };
        }
      }

      for (let f of this.finalParameters.fields.filter(
        (f: Field) => f.type == "link" && f.sources != null
      )) {
        const fieldSources = mapSources(
          f.sources,
          this.app,
          this.settings.globalIgnoreFilters
        );

        let autocomplete = (
          await Promise.all(fieldSources.map((x: Source) => x.loadData()))
        )
          .flat()
          .map((x: Row) => x._file.name.replace(".md", ""));
        f._sourceAutocomplete = autocomplete;
      }

      this.sources = mapSources(
        this.finalParameters.sources,
        this.app,
        this.settings.globalIgnoreFilters
      );

      this.rows = (
        await Promise.all(this.sources.map((x: Source) => x.loadData()))
      ).flat();
    },
  },
};
</script>