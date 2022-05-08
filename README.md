## Obsidian Database Plugin

Do you like Dataview plugin for Obsidian? This one is taking Dataview to next level, but not only allowing you to view the data, but also... edit it in place!

## Features

- allows you to generate a table based on files in a directory
- the table is editable, if you edit a cell the changes will be written to original file!
- supports multiple types of data, including rating with stars and progress bars
- supports sorting by multiple columns (including dynamic sorting by clicking on column header)
- supports creating links between documents (the real ones, shown on graph)

## Example

Let's create a database of motorcycles offers you consider buying.

1. create directory called `motorcycles`
2. create a file with a table:

```
```databaseTable
sources:
- type: directory
  path: motorcycles
fields:
- name: file
  type: fileName
  label: File
  width: 20%
- name: brand
  label: Brand
  type: link
- name: model # field name in frontmatter
  label: Model # display label
- name: year
  label: Year
- name: mileage
  label: Mileage
- name: accessories
  label: Accessories
  type: dropdown
  multiple: true
  options:
  - label: Crash bars
    value: crash-bars
  - label: Bags
    value: bags
  - label: Cruise control
    value: cruise-control
  - name: rate
    label: Rate
    type: rating
    width: 10%
  - name: owned
    label: Owned
    type: checkbox
\```
```
(replace final line with triple ` )

3. now, create some files inside directory `motorcycles`, they can be blank or you can put some sample frontmatter matching `name` in the list above
4. after you go back to a file with a table, you should see entries for newly created files
5. you can put data in the table now and they will be filled inside the files!

![Sample view](assets/motorcycles-db.png)

## Field types

The plugin, at the moment, supports the following field types:

### fileName

Generates clickable link with filename.
### filePath

Generates clickable link with full file path (relative to vault root).

### link

This type generates a block with links in the target documents, you can add `multiple: true` to link to multiple documents.

### rating

Shows 5 stars control for providing a rating.

### progress -

Shows a slider that you can use to set the progress  (0-100%).

### checkbox

Simple checkbox with true/false values

### dropdown

Generates a dropdown with selectable values. You can use it to select predefined value or values from list:

Multiple values example:

```
- name: accessories
  label: Accessories
  type: dropdown
  multiple: true
  options:
  - label: Crash bars
    value: crash-bars
  - label: Bags
    value: bags
  - label: Cruise control
    value: cruise-control
```

Single value example (with colors):

```
- name: status
  label: Status
  type: dropdown
  width: 10%
  options:
  - label: In progress
    value: inProgress
    color: green
  - label: Next up
    value: nextUp
    color: gray
    dark: true
```

By default, the font color will be determined automatically, but if you want to adjust it to be white, then mark the item with `dark: true` to indicate that a provided color is dark.

### Other types

`number`, `text`, `date` and other supported by HTML input field (when field type is not any of above, it fallbacks to standard input field with type specified)

## Known issues

- doesn't support inline adding of new files/records yet
- sometimes it doesn't show when changed from live preview to reading mode
- doesn't support dark mode
- uses ugly CSS to show context menus
- sometimes it shows unnecessary vertical scrollbar (when editor is not wide enough)

## Future plan
- add filtering
- add grouping
- add sorting in both directions in the code
- add autosuggest for link fields
- add ability to use Dataview queries as a source

## Use plugins and other projects

This plugin is powered by [Vue](https://github.com/vuejs/vue) and [Vuetify](https://github.com/vuetifyjs/vuetify)!