<script lang="ts">
import Vue from "vue";
import type { Field } from "../field";
import { Row } from "../source";
import type { Source } from "../source";
import {
  VAlert,
  VDataTable,
  VApp,
  VTextField,
  VRating,
  VSlider,
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
      await row._source.setLink(row._file, field, row[field]);
    },

    getCellStyle(field: Field, row: Row): string {
      const fieldValue = row[field.name];

      if (field.type == "dropdown") {
        const selectedOption = field.options
          .filter((x: any) => x.value == fieldValue)
          .first();

        if (selectedOption && selectedOption.color) {
          return `background-color: ${selectedOption.color}; color: white !important`;
        }
      }

      return "";
    },
  },
  async mounted() {
    this.rows = (
      await Promise.all(this.sources.map((x) => x.loadData()))
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
            <a
              :href="'obsidian://open?file=' + item._file.name"
              v-if="field.type == 'fileName'"
              >{{ item._file.name }}</a
            >
            <a
              :href="'obsidian://open?file=' + item._file.name"
              v-if="field.type == 'filePath'"
              >{{ item._file.path }}</a
            >

            <input
              v-if="field.type == 'link'"
              type="text"
              v-model.lazy="item[field.name]"
              @change="linkUpdated(item, field.name)"
            />

            <!-- <span v-if="field.type == 'link'">
              <a
                v-for="link in item[field.name].split(',')"
                :key="link"
                :href="'obsidian://open?file=' + link"
                >{{ link }}</a
              >
            </span> -->

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
            ></v-rating>

            <v-slider
              v-if="field.type == 'progress'"
              dense
              hide-details="auto"
              v-model.lazy="item[field.name]"
              @end="fieldUpdated(item, field.name)"
            ></v-slider>

            <input
              v-if="
                !field.type ||
                (field.type != 'dropdown' &&
                  field.type != 'link' &&
                  field.type != 'progress' &&
                  field.type != 'fileName' &&
                  field.type != 'filePath' &&
                  field.type != 'rating')
              "
              :type="field.type"
              :placeholder="'' + (field.default || '')"
              v-model.lazy="item[field.name]"
              @change="fieldUpdated(item, field.name)"
            />

            <select
              v-if="field.type == 'dropdown'"
              v-model="item[field.name]"
              @change="fieldUpdated(item, field.name)"
            >
              <option
                :value="option.value"
                v-for="option in field.options"
                :key="option.value"
              >
                {{ option.label }}
              </option>
            </select>
          </td>
        </tr>
      </template>
    </v-data-table>
  </v-app>
</template>
<style scoped>
a,
a:hover {
  text-decoration: none;
}

td {
  white-space: normal;
}

th {
  white-space: nowrap;
  border: none !important;
}

input,
input:hover,
select {
  padding: 0 0;
  margin: 0 0;
  border: 0;
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
</style>