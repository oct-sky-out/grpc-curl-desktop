export interface ProtoFile {
  path: string
  content: string
  name: string
}

export interface ProtoMethod {
  name: string
  service: string
  inputType: string
  outputType: string
  requestFields?: ProtoField[]
}

export interface ProtoField {
  name: string
  type: string
  required: boolean
  repeated: boolean
}

export interface GrpcRequest {
  method: ProtoMethod
  endpoint: string
  data: any
}

export interface GrpcResponse {
  data: any
  error?: string
  status?: string
}

export interface FavoriteEndpoint {
  id: string
  name: string
  url: string
  createdAt: string
}

export interface TabData {
  id: string
  title: string
  protoFile: ProtoFile | null
  packageName: string
  services: any[]
  methods: ProtoMethod[]
  selectedMethod: ProtoMethod | null
  endpoint: string
  requestData: string
  response: GrpcResponse | null
  loading: boolean
  error: string | null
}