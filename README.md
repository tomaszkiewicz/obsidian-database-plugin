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
- name: model
  label: Model
- name: year
  label: Year
- name: mileage
  label: Mileage
- name: rate
  label: Rate
  type: rating
  width: 10%
\```
```
(replace final line with triple ` )

3. now, create some files inside directory `motorcycles`, they can be blank or you can put some sample frontmatter matching `name` in the list above
4. after you go back to a file with a table, you should see entries for newly created files
5. you can put data in the table now and they will be filled inside the files!

![Sample view](assets/motorcycles-db.png)

## Field types

The plugin, at the moment, supports the following field types:

- fileName - name of the file
- filePath - path to the file
- link - this field generates a block with links in the target documents, every entry that you put (separated by a comma) will be saved as a link in the document
- rating - shows 5 stars for providing a rating
- progress - shows progress bar (0-100%)
- dropdown - generates a dropdown with selectable values, the sample format:

```
- name: acidity
  label: Kwasowość
  type: dropdown
  options:
  - label: wytrawne
    value: dry
    color: red
  - label: półwytrawne
    value: semi-dry
    color: orange
  - label: półsłodkie
    value: semi-sweet
    color: darkgreen
    fontColor: white
  - label: słodkie
    value: sweet
```
- any other - `number`, `text` and other supported by HTML input field (when field type is not any of above, it fallbacks to standard input field with type specified)

## Known issues

- doesn't support inline adding of new files/records
- sometimes it doesn't show when changed from live preview to reading mode
- doesn't support dark mode
- dropdown doesn't allow to customize font color

## Future plan
- add filtering
- add grouping
- add autosuggest for link fields
- add clickable links to files in link fields

## Use plugins and other projects

This plugin is powered by [Vue](https://github.com/vuejs/vue) and [Vuetify](https://github.com/vuetifyjs/vuetify)!