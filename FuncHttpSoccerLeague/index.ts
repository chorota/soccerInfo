import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import { CosmosClient } from "@azure/cosmos"
import { cosmosDBconnectionInfo, Cosmosdatabase, Cosmoscontainer } from "../Shared/config"

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
  //
  context.log('HTTP trigger function processed a request.');
  const reqinfoleage = (req.query.leage || (req.body && req.body.leage));
  const responseMessage = reqinfoleage
    ? "Hello, " + reqinfoleage + ". This HTTP triggered function executed successfully."
    : "This HTTP triggered function executed successfully. Pass a name in the query string or in the request body for a personalized response.";
  //
  
  const para:string =context.bindingData.category ? context.bindingData.category : null;
  context.log("パラメータ値："+para);

  //CosmosDB接続情報
  const client = new CosmosClient(cosmosDBconnectionInfo);
  const { database } = await client.databases.createIfNotExists({ id: Cosmosdatabase });
  const { container } = await database.containers.createIfNotExists({ id: Cosmoscontainer });
  //取得するリーグ情報をチェック
  const leages: Array<string> = ["BL1", "PL", "DED", "PPL", "FL1", "SA"];
  //leages.forEach((leage)=>{ if (leage !== reqinfoleage)  return false})
  //リーグごとに最新データの取得＋登録を繰り返す。
  let resultdata:string;
  try {
    for (let leage of leages) {
      //ランキングデータをCosmosDBから取得する。
      try {
        context.log.info(await container.item(leage, leage));
        context.log.info("CosmosDBからのデータ取得完了。");
      } catch (err) {
        switch (err.code) {
          case 404:
            context.log.error(leage, ":の情報が存在しませんでした。処理を続行します。errの内容:" + err);
            break;
          case 429:
            context.log.error(leage, ":の削除処理で429TooManyReqestが発生しました。処理を続行します。errの内容:" + err);
            break;
          default:
            context.log.error(leage, ":の削除処理で失敗しました。" + err);
            throw err;
        }
      };
    }
  } catch (err) {
    context.log.error("処理にエラーが発生しました。" + err);
  }

  //レスポンス情報の作成
  context.res = {
    // status: 200, /* Defaults to 200 */
    staus:200,
    body: responseMessage
  };

};

export default httpTrigger;