<script lang="ts">
import Vue from "vue";
import type { Field } from "../field";
import { AddSource, Row } from "../source";
import MarkdownLink from "./MarkdownLink.vue";
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
  VBtn,
  VIcon,
  VImg,
  VRow,
  VCol,
  VSpacer,
  VContainer,
} from "vuetify/lib";

export default Vue.extend({
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
    VIcon,
    VBtn,
    VImg,
    VRow,
    VCol,
    VSpacer,
    VContainer,
  },
  directives: {
    Ripple,
  },
  props: {
    fields: [],
    groupBy: [],
    sources: [],
    rows: [],
    sortBy: [],
    urlBase: String,
  },
  data() {
    return {
      newFileName: "",
    };
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
    addSources() {
      return this.sources.filter((s: AddSource) => "addRow" in s);
    },
  },
  methods: {
    async addRow(): Promise<void> {
      const addSources = this.addSources;
      if (addSources.length == 1) {
        await addSources[0].addRow(this.newFileName);
      }
      this.$emit("refresh");
    },

    async rowDeleted(row: Row): Promise<void> {
      await row._source.deleteRow(row._file);
      this.$emit("refresh");
    },

    async fieldUpdated(row: Row, field: string): Promise<void> {
      console.log(`updated field ${field} on ${row._file.path}`);
      await row._source.setData(row._file, field, row[field]);
    },

    async linkUpdated(row: Row, field: string): Promise<void> {
      console.log(`updated link ${field} on ${row._file.path}`);

      if (!Array.isArray(row[field]) && row[field] != null) {
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

    getFieldByName(name: string): Field {
      return this.fields.filter((f: Field) => f.name == name).first();
    },

    getFieldSelectedOption(fieldName: string, optionValue: string): any {
      return this.getFieldByName(fieldName)
        .options.filter((o: any) => o.value == optionValue)
        .first();
    },
  },
});
</script>
<template>
  <v-data-table
    class="ma-0 pa-0"
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

          <v-btn
            v-if="field.type == 'delete'"
            icon
            x-small
            @click="rowDeleted(item)"
          >
            <v-icon>mdi-delete-outline</v-icon>
          </v-btn>

          <v-img
            v-if="field.type == 'image' && item[field.name]"
            :src="`app://local/${urlBase}/${item[field.name]}`"
            :max-width="field.maxWidth"
            :max-height="field.maxHeigh"
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
            <template v-slot:selection="{ item }">
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
                field.type != 'delete' &&
                field.type != 'image' &&
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

    <template
      v-slot:group.header="{ groupBy, group, isOpen, toggle, remove }"
      :fields="fields"
    >
      <td :colspan="headers.length">
        <v-icon @click="toggle">
          {{ isOpen ? "mdi-minus" : "mdi-plus" }}
        </v-icon>
        <span
          >{{ getFieldByName(groupBy[0]).label }} :
          {{ getFieldSelectedOption(groupBy[0], group).label }}</span
        >
        <!-- <v-icon @click="remove"> mdi-close </v-icon> -->
      </td>
    </template>

    <template v-slot:body.append="{ headers }" v-if="addSources.length > 0">
      <tr>
        <td
          :colspan="headers.length"
          style="text-align: center; background-color: white"
        >
          <v-row class="ma-0 pa-0" no-gutters dense>
            <v-spacer />
            <v-col cols="4" class="pa-0 ma-0">
              <v-text-field
                v-model="newFileName"
                append-outer-icon="mdi-plus-circle-outline"
                placeholder="new file name"
                type="text"
                hide-details
                solo
                flat
                single-line
                @keydown.enter="addRow"
                @click:append-outer="addRow"
              />
            </v-col>
            <v-spacer />
          </v-row>
        </td>
      </tr>
    </template>
  </v-data-table>
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
  overflow-x: hidden;
}

div >>> .v-select.v-input--dense .v-chip {
  margin-top: 2px;
  margin-bottom: 2px;
}

/*
// for future use in grouping
div >>> tr.v-row-group__header {
  background-color: white !important;
}
*/
</style>
