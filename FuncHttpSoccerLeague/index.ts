import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import { CosmosClient , Item, ItemResponse } from "@azure/cosmos"
import { cosmosDBconnectionInfo, Cosmosdatabase, Cosmoscontainer } from "../Shared/config"
import { League } from "../models/League"

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
  
  //CosmosDB接続情報
  const client = new CosmosClient(cosmosDBconnectionInfo);
  const { database } = await client.databases.createIfNotExists({ id: Cosmosdatabase });
  const { container } = await database.containers.createIfNotExists({ id: Cosmoscontainer });

  //取得するリーグ情報をチェック
  
  
  //検索クエリ
  const querySpec = {
    query: "SELECT * from Items c where c.id = @leaguename",
    parameters: [
      {
        name: "@leaguename",
        value: null
      }
    ]
  };

  //リーグごとに最新データの取得＋登録を繰り返す。
  let resultdatas : Array<ILeague> = new Array<ILeague>();

  const param:string =context.bindingData.category ? context.bindingData.category : null;
  let leages: Array<string> = new Array<string>();
  if(param){
    leages[0] = param;
  }else{
    leages = ["BL1", "PL", "DED", "PPL", "FL1", "SA"];
  }
  
  try {
    for (let leage of leages) {
      //ランキングデータをCosmosDBから取得する。
      try {
        //リーグ情報をSQLクエリのパラメータにセット
        querySpec.parameters[0].value = leage;
        const { resources: results } = await container.items.query(querySpec).fetchAll();
        if (results.length == 0) {
          throw "取得結果が０件でした。";
        } else if (results.length > 1) {
          throw "取得結果が１件以上存在しました。";
        }
        let resultdata : League = new League();
        resultdata.id = results[0].id;
        resultdata.data = results[0].data;
        resultdatas.push(resultdata);
        context.log.info(resultdata);
        context.log.info("CosmosDBから",leage,"のデータ取得完了。");
      } catch (err) {
        switch (err.code) {
          case 404:
            context.log.error(leage, ":の情報が存在しませんでした。処理を続行します。errの内容:" + err);
            break;
          case 429:
            context.log.error(leage, ":の取得処理で429TooManyReqestが発生しました。処理を続行します。errの内容:" + err);
            break;
          default:
            context.log.error(leage, ":の取得処理で失敗しました。" + err);
            throw err;
        }
      };
    }
  } catch (err) {
    context.log.error("処理にエラーが発生しました。" + err);
  }

  //レスポンス情報の作成
  if(resultdatas.length > 0){
    context.res = {
      // status: 200, /* Defaults to 200 */
      status:200,
      body: resultdatas
    };
  }else{
    context.res = {
      status:400,
      body: 'BadRequest:データ取得できないパラメータが設定されています。'
    };
  }
  

};

export default httpTrigger;