<script lang="ts">
import Vue from "vue";
import { MarkdownRenderer } from "obsidian";

export default Vue.extend({
  data() {
    return {};
  },
  components: {},
  props: {
    href: "",
    path: "",
  },
  computed: {},
  mounted() {
    if (this.href != null){
      MarkdownRenderer.renderMarkdown(
        `<span>[[${this.href.replace(".md", "")}]]</span>`,
        this.$el,
        "Untitled",
        this
      );
    }
  },
});
</script>
<template></template>
<style scoped>
div >>> span {
  white-space: nowrap;
}
</style>