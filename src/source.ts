import { stringifyYaml } from 'obsidian';
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

export class DirectorySource implements Source {
  vault: Vault
  path: string
  metadataCache: MetadataCache

  constructor(path: string, vault: Vault, metadataCache: MetadataCache) {
    this.vault = vault
    this.path = path
    this.metadataCache = metadataCache
  }

  async loadData(): Promise<Row[]> {
    const files = this.vault.getFiles().filter(f => f.path.startsWith(this.path))
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
      if (Array.isArray(linksObj[k])) {
        linksObj[k] = linksObj[k].join(", ")
      }
      linksObj[k] = linksObj[k].replaceAll("[[", "").replaceAll("]]", "")
    }

    return Promise.resolve(linksObj)
  }

  async setLink(file: TFile, field: string, value: string): Promise<void> {
    let content = await this.vault.read(file)
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

    linksObj[field] = value.contains(",") ? value.split(",").map(x => `[[${x.trim()}]]`) : `[[${value}]]`

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
    let contentWithoutFrontmatter = await this.vault.read(file)
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