<script lang="ts">
import Vue from "vue";
import type { Field } from "../field";
import { mapSources, Row } from "../source";
import MarkdownLink from "./MarkdownLink.vue";
import type { Source } from "../source";
import { TinyColor } from "@ctrl/tinycolor";
import {
  VAlert,
  VDataTable,
  VApp,
  VTextField,
  VRating,
  VSlider,
  VSelect,
  VSimpleCheckbox,
  VCombobox,
  VChip,
  Ripple,
} from "vuetify/lib";

export default Vue.extend({
  data() {
    return {
      rows: [] as Row[],
    };
  },
  components: {
    VAlert,
    VDataTable,
    VApp,
    VTextField,
    VRating,
    VSlider,
    MarkdownLink,
    VSelect,
    VSimpleCheckbox,
    VCombobox,
    VChip,
  },
  directives: {
    Ripple,
  },
  props: {
    fields: [],
    sources: [],
    groupBy: [],
    sortBy: [],
  },
  computed: {
    headers() {
      return this.fields.map((f: any) => {
        return {
          text: f.label || f.name,
          value: f.name,
        };
      });
    },
  },
  methods: {
    async fieldUpdated(row: Row, field: string): Promise<void> {
      console.log(`updated field ${field} on ${row._file.path}`);
      await row._source.setData(row._file, field, row[field]);
    },

    async linkUpdated(row: Row, field: string): Promise<void> {
      console.log(`updated link ${field} on ${row._file.path}`);

      if (!Array.isArray(row[field])) {
        row[field] = [row[field]];
      }

      await row._source.setLink(row._file, field, row[field]);
    },

    getCellStyle(field: Field, row: Row): string {
      const fieldValue = row[field.name];

      if (field.type == "dropdown") {
        const selectedOption = field.options
          .filter((x: any) => x.value == fieldValue)
          .first();

        if (selectedOption && selectedOption.color) {
          return `background-color: ${selectedOption.color}`;
        }
      }

      return "";
    },

    isFontWhite(field: Field, row: Row): boolean {
      const fieldValue = row[field.name];

      if (field.type == "dropdown") {
        const selectedOption = field.options
          .filter((x: any) => x.value == fieldValue)
          .first();

        if (selectedOption && selectedOption.color) {
          return (
            selectedOption.dark || new TinyColor(selectedOption.color).isDark()
          );
        }
      }

      return false;
    },
  },

  async mounted() {
    this.rows = (
      await Promise.all(this.sources.map((x : Source) => x.loadData()))
    ).flat();
  },
});
</script>
<template>
  <v-app>
    <v-data-table
      :headers="headers"
      :items="rows"
      hide-default-footer
      dense
      :group-by="groupBy"
      item-key="_file.path"
      multi-sort
      :sort-by="sortBy"
      :items-per-page="-1"
    >
      <template v-slot:item="{ item }" :fields="fields">
        <tr :data-category-id="item._file.path" :data-id="item._file.path">
          <td
            v-for="field in fields"
            :key="field.name"
            :style="getCellStyle(field, item)"
            :width="field.width || ''"
          >
            <markdown-link
              :href="item._file.name"
              v-if="field.type == 'fileName'"
            />

            <markdown-link
              :href="item._file.name"
              v-if="field.type == 'filePath'"
            />

            <v-combobox
              v-if="field.type == 'link'"
              v-model="item[field.name]"
              :items="field._sourceAutocomplete || []"
              hide-details
              dense
              :multiple="field.multiple"
              @change="linkUpdated(item, field.name)"
            >
              <template v-slot:selection="{ attrs, item, parent, selected }">
                <v-chip v-if="field.multiple" small
                  ><markdown-link :href="Array.isArray(item) ? item[0] : item"
                /></v-chip>
                <markdown-link
                  v-else
                  :key="item.join(',')"
                  :href="Array.isArray(item) ? item[0] : item"
                />
              </template>
            </v-combobox>

            <v-rating
              v-if="field.type == 'rating'"
              hover
              half-increments
              dense
              :value="1 * (item[field.name] || 0)"
              @input="
                item[field.name] = $event;
                fieldUpdated(item, field.name);
              "
            />

            <v-slider
              v-if="field.type == 'progress'"
              dense
              hide-details
              v-model.lazy="item[field.name]"
              @end="fieldUpdated(item, field.name)"
            />

            <input
              v-if="
                !field.type ||
                (field.type != 'dropdown' &&
                  field.type != 'link' &&
                  field.type != 'progress' &&
                  field.type != 'fileName' &&
                  field.type != 'filePath' &&
                  field.type != 'checkbox' &&
                  field.type != 'rating')
              "
              :type="field.type"
              :placeholder="'' + (field.default || '')"
              v-model.lazy="item[field.name]"
              @change="fieldUpdated(item, field.name)"
            />

            <v-simple-checkbox
              v-if="field.type == 'checkbox'"
              v-model="item[field.name]"
              hide-details
              dense
              @input="fieldUpdated(item, field.name)"
            />

            <v-select
              v-if="field.type == 'dropdown'"
              v-model="item[field.name]"
              :items="field.options"
              hide-details
              item-text="label"
              item-value="value"
              dense
              :dark="isFontWhite(field, item)"
              :small-chips="field.multiple != null && field.multiple != false"
              :multiple="field.multiple != null && field.multiple != false"
              :chips="field.multiple != null && field.multiple != false"
              @change="fieldUpdated(item, field.name)"
            />
          </td>
        </tr>
      </template>
    </v-data-table>
  </v-app>
</template>
<style scoped>
div >>> a,
div >>> a:hover {
  text-decoration: none;
}

div >>> td {
  white-space: normal;
}

div >>> p {
  padding: 0 0;
  margin: 0 0;
  display: inline;
}

div >>> th {
  white-space: nowrap;
  border: none !important;
}

div >>> input,
div >>> input:hover,
div >>> .v-input,
div >>> .v-input__control,
div >>> .v-input__slot::before,
div >>> .v-input__slot::after,
div >>> select {
  padding: 0 0;
  margin: 0 0;
  border: 0;
  height: unset !important;
  width: 100%;
  background: none;
  font-size: 14px;
  border: none !important;
}

tr:nth-child(even) {
  background: #f4f4f4;
}

tr:nth-child(odd) {
  /* background: #fff; */
}

div >>> .v-menu__content {
  z-index: 100;
}

div >>> .v-data-table__wrapper {
  overflow-y: visible;
}

/*
// for future use in grouping
div >>> tr.v-row-group__header {
  background-color: white !important;
}
*/
</style>
