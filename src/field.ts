import { Source } from "./source"

export interface Field {
  name : string
  type : string
  options: any
  sources: Source[]
}