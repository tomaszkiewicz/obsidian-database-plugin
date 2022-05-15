import { App, stringifyYaml, } from 'obsidian';
import { parseYaml } from 'obsidian';
import { Vault, MetadataCache, TFile } from 'obsidian';

export class Row {
  _file: TFile
  _source: Source
  [key: string]: any
}

export interface Source {
  loadData(): Promise<Row[]>
  readLinks(file: TFile): Promise<any>
  setLink(file: TFile, field: string, value: string): Promise<void>
  setData(file: TFile, field: string, value: string): Promise<void>
}

export const mapSources = (sources: any, app: App): Source[] => {
  return sources.map((s: any) => {
    switch (s.type) {
      case "directory":
        return new DirectorySource(s.path, app.vault, app.metadataCache)

      case "tags":
        return new TagsSource(s.tags, app.vault, app.metadataCache)

      case "related":
        return new RelatedSource(app.workspace.getActiveFile().path, s.tags, app.vault, app.metadataCache)
    }
  })
}

export abstract class FileSystemSource implements Source {
  constructor(protected vault: Vault, protected metadataCache: MetadataCache) {
  }

  abstract getFiles(): TFile[]

  async loadData(): Promise<Row[]> {
    const files = this.getFiles()
    const rows = [] as Row[]

    for (let f of files) {
      const links = await this.readLinks(f)
      rows.push({
        ...this.metadataCache.getFileCache(f).frontmatter,
        ...links,
        _file: f,
        _source: this,
      })
    }

    return Promise.resolve(rows)
  }

  async readLinks(file: TFile): Promise<any> {
    let content = await this.vault.read(file)
    const startIndex = content.indexOf("%%%")
    const endIndex = content.indexOf("%%%", startIndex + 3)
    if (startIndex == -1) {
      return Promise.resolve({})
    }
    const linksContent = content.substring(startIndex + 3, endIndex)
    const linksObj = parseYaml(linksContent) || {}

    for (let k in linksObj) {
      if (!Array.isArray(linksObj[k])) {
        linksObj[k] = linksObj[k].split(",")
      }
      for (let i in linksObj[k]) {
        linksObj[k][i] = linksObj[k][i].replaceAll("[[", "").replaceAll("]]", "")
      }
    }

    return Promise.resolve(linksObj)
  }

  async setLink(file: TFile, field: string, value: any): Promise<void> {
    let content = await this.vault.cachedRead(file)
    const startIndex = content.indexOf("%%%")
    const endIndex = content.indexOf("%%%", startIndex + 3)

    let beforeLinksContent = ""
    let linksContent = ""
    let afterLinksContent = ""

    if (startIndex == -1) {
      // no links section, create one and make sure it doesn't kill frontmatter
      const frontmatter = this.metadataCache.getFileCache(file).frontmatter
      if (frontmatter) {
        beforeLinksContent = content.substring(0, frontmatter.position.end.offset + 1)
        afterLinksContent = content.substring(frontmatter.position.end.offset)
      } else {
        afterLinksContent = content
      }
    } else {
      beforeLinksContent = content.substring(0, startIndex)
      linksContent = content.substring(startIndex + 3, endIndex)
      afterLinksContent = content.substring(endIndex + 3)
    }

    const linksObj = parseYaml(linksContent) || {}

    if (!Array.isArray(value)) {
      value = [value]
    }

    linksObj[field] = value.map((x: string) => `[[${x.trim()}]]`)

    if (linksObj[field].length == 1) {
      linksObj[field] = linksObj[field][0]
    }

    let outFileContents = ""
    outFileContents += beforeLinksContent
    outFileContents += "%%%\n"
    outFileContents += stringifyYaml(linksObj)
    outFileContents += "%%%"
    outFileContents += afterLinksContent

    await this.vault.modify(file, outFileContents)

    return Promise.resolve()
  }

  async setData(file: TFile, field: string, value: string): Promise<void> {
    let contentWithoutFrontmatter = await this.vault.cachedRead(file)
    let frontmatterContent = ""
    const frontmatter = this.metadataCache.getFileCache(file).frontmatter

    if (frontmatter) {
      frontmatterContent = contentWithoutFrontmatter.substring(frontmatter.position.start.offset + 3, frontmatter.position.end.offset - 3)
      contentWithoutFrontmatter = contentWithoutFrontmatter.substring(frontmatter.position.end.offset)
    }

    const frontmatterObj = parseYaml(frontmatterContent) || {}
    frontmatterObj[field] = value

    let outFileContents = "---\n"
    outFileContents += stringifyYaml(frontmatterObj)
    outFileContents += "---"
    if (!frontmatter) {
      outFileContents += "\n"
    }
    outFileContents += contentWithoutFrontmatter

    await this.vault.modify(file, outFileContents)

    return Promise.resolve()
  }
}

export class DirectorySource extends FileSystemSource {
  constructor(private path: string, vault: Vault, metadataCache: MetadataCache) {
    super(vault, metadataCache)
  }

  getFiles(): TFile[] {
    return this.vault.getMarkdownFiles().filter(f => f.path.startsWith(this.path))
  }
}

export class TagsSource extends FileSystemSource {
  constructor(private tags: string[], vault: Vault, metadataCache: MetadataCache) {
    super(vault, metadataCache)
  }

  getFiles(): TFile[] {
    return filterByTags(this.vault.getMarkdownFiles(), this.tags, this.metadataCache)
  }
}

export class RelatedSource extends FileSystemSource {
  constructor(private currentFile: string, private tags: string[], vault: Vault, metadataCache: MetadataCache) {
    super(vault, metadataCache)
  }

  getFiles(): TFile[] {
    const files: string[] = []

    for (const k in this.metadataCache.resolvedLinks) {
      if (this.metadataCache.resolvedLinks[k][this.currentFile]) {
        files.push(k)
      }
    }

    return filterByTags(this.vault.getMarkdownFiles().filter(x => files.contains(x.path)), this.tags, this.metadataCache)
  }
}

function filterByTags(files: TFile[], tags: string[], metadataCache : MetadataCache): TFile[] {
  if (tags == null || tags.length == 0) {
    return files
  }

  return files.map(f => {
    let fmTags = metadataCache.getFileCache(f).frontmatter?.tags || ""

    if (!Array.isArray(fmTags)) {
      fmTags = fmTags.split(",").map((x: string) => x.trim())
    }

    return {
      tags: fmTags,
      file: f,
    }
  })
    .filter(x => x.tags.some((r: string) => tags.contains(r)))
    .map(x => x.file)
}