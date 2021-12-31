import { CosmosClientOptions } from "@azure/cosmos";

//CosmoSDB情報
export const cosmosDBconnectionInfo: CosmosClientOptions = {
  endpoint: process.env.COSMOS_ENDPOINT,
  key: process.env.COSMOS_KEY
};
export const Cosmosdatabase = "AppData";
export const Cosmoscontainer = "Items";

//footboal-data情報
export interface footboalconnectonInfo{
  urlPrefixes:string,
  urlSuffixes:string,
  token:string
}
export const footboalconnectonInfo : footboalconnectonInfo = {
  urlPrefixes: process.env.FOOTBOAL_DATA_ENDPOINT_PRE,
  urlSuffixes: process.env.FOOTBOAL_DATA_ENDPOINT_SUF,
  token: process.env.FOOTBOAL_DATA_TOKEN  
}



