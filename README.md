## Obsidian Database Plugin

Do you like Dataview plugin for Obsidian? This one is taking Dataview to next level, but not only allowing you to view the data, but also... edit it in place!

## Features

- allows you to generate a table based on files in a directory
- the table is editable, if you edit a cell the changes will be written to original file!
- supports multiple types of data, including rating with stars and progress bars
- supports sorting by multiple columns (including dynamic sorting by clicking on column header)
- supports creating links between documents (the real ones, shown on graph)
- you can create templates with a subset of fields and include them in multiple files

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
  sources:
  - type: directory
    path: brands
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

3. now, create some files inside directory `motorcycles` (and if you want autosuggest for `Brand` field then create some files in `brands` folder), they can be blank or you can put some sample frontmatter matching `name` in the list above
4. after you go back to a file with a table, you should see entries for newly created files
5. you can put data in the table now and they will be filled inside the files!

![Sample view](assets/motorcycles-db.png)

## Sources

There are the following sources available:
### directory

Reads all files from specified directory.

Example usage:

```
sources:
- type: directory
  path: motorcycles
```

This source supports adding files. After you set your source, in the last line there will be a new input and button displayed so you can add new file directly from the table.

### tags

Reads all files with one of the tags specified.

Example usage:

```
sources:
- type: tags
  tags:
  - motorcycles
```

This source supports adding files. After you set your source, in the last line there will be a new input and button displayed so you can add new file directly from the table.

> **⚠ WARNING:**
> If you use some plugins for templating (like Templater) the plugins may override files created by Database Plugin and remove default tagging it sets, so the file may not show properly in the table!

### related

Reads all files that refer to current file, optionally with one of the tags specified.

Example usage:

```
sources:
- type: related
  tags:
  - motorcycles
```

### self

Self source provides a convenient way to refer to the file the table is embedded into.

This source is especially useful in your daily notes, as you can make a nice machanism for tracking habits:

![Self source](assets/self-source.png)

Sample code for above view (btw, I suggest adding that to template and then use `include` feature so you can easily update that table in the future):

```
sources:
- type: self
fields:
- name: meditation
  label: Meditation
  type: checkbox
- name: excercise
  label: Excercise
  type: checkbox
- name: eating
  label: Eat healthy
  type: checkbox
- name: walk
  label: Go for a walk
  type: checkbox
- name: sleep
  label: Sleep >7h
  type: checkbox
```

## Field types

The plugin, at the moment, supports the following field types:

### fileName

Generates clickable link with filename.
### filePath

Generates clickable link with full file path (relative to vault root).

### link

This type generates a block with links in the target documents, you can add `multiple: true` to link to multiple documents.

To enable autocomplete you need to add `source` parameter:

```
- name: brand
  label: Brand
  type: link
  sources:
  - type: directory
    path: brands
```

This way the plugin searches `brands` directory and suggest linking to any file within that directory.

### rating

Shows 5 stars control for providing a rating.

### progress

Shows a slider that you can use to set the progress  (0-100%).

### checkbox

Simple checkbox with true/false values

### image

This field allows you to display image in table cell.
The image is **read-only** and cannot be modified from the table in the current version.

The path to the image should be relative to vault root, e.g. `motorcycles/images/f750gs.jpg`

Sample file with the data:
```
---
image: motorcycles/images/f750.jpg
---
```

You can configure field with optional `maxWidth` and `maxHeigh` and the image will be scaled to fit that sizes:

```
- name: image
  type: image
  label: Image
  maxWidth: 100px
  maxHeigh: 100px
```

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

### delete

By adding a special column with type `delete` you can enable delete feature for your database:

```
- type: delete
  width: 1%
```

> **⚠ WARNING:**
> Current version of plugin instantly deletes the file, without any confirmation!

### Other types

`number`, `text`, `date` and other supported by HTML input field (when field type is not any of above, it fallbacks to standard input field with type specified)

## Templates and including other files

If you need to use some of the settings in multiple files you can move that common settings to separate file (in frontmatter section) and then use `include` to read that file:

```
include: "database-templates/motorcycles.md"
```

You can also include multiple files:

```
include:
- "database-templates/a.md"
- "database-templates/b.md"
```

If you have both `include` statement as well as inline parameters, the merging process happens first by evaluating list of `include` and then inline parameters, so they take precedence over `include` - this way you can override some settings, if needed.

## Settings

### Global ignore filter

This setting allow you to set a list of regexpes that will be applied to all your tables.

It's especially useful e.g. if you're using Folder Note plugin which generates `index.md` file in the folder.

## Known issues

- `tags` source sometimes doesn't refresh correctly after adding new file
- plugin doesn't show errors inline (only in developer console)
- doesn't support dark mode
- uses ugly CSS to show context menus

## Future plan
- add filtering
- add grouping
- add sorting in both directions in the code
- add ability to use Dataview queries as a source

## Use plugins and other projects

This plugin is powered by [Vue](https://github.com/vuejs/vue) and [Vuetify](https://github.com/vuetifyjs/vuetify)!