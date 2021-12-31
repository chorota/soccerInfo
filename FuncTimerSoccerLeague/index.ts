import { AzureFunction, Context } from "@azure/functions"
import axios from "axios"
import { CosmosClient } from "@azure/cosmos";
import {cosmosDBconnectionInfo ,Cosmosdatabase,Cosmoscontainer} from "../Shared/config";
import {footboalconnectonInfo} from "../Shared/config";

/*************************************
 * サッカーリーグランキング情報取得Function
 * <概要>
 * footbal-data.orgのAPIでランキング情報を取得し、
 * AzureCosmosDBへ更新を行う。
 *  
 * <Todo>
 * Githubへの登録
 * リトライ処理の追加
*************************************/
const timerTrigger: AzureFunction = async function (context: Context, myTimer: any): Promise<void> {
  var timeStamp = new Date().toISOString();
  //CosmosDB接続情報
  const client = new CosmosClient(cosmosDBconnectionInfo);
  const { database } = await client.databases.createIfNotExists({ id:  Cosmosdatabase});
  const { container } = await database.containers.createIfNotExists({ id: Cosmoscontainer });

  //稼働ログ出力
  if (myTimer.isPastDue) {
    context.log.info('Timer function is running late!');
  }
  context.log.info('Timer trigger function ran!', timeStamp);

  //取得するリーグ情報
  const leages: Array<string> = ["BL1", "PL", "DED", "PPL", "FL1", "SA"];
  //リーグごとに最新データの取得＋登録を繰り返す。
  try {
    for (let leage of leages) {
      //リーグ情報の取得。
      context.log.info(leage + ":を取得します。");
      const standings = await footBallorgDataGet(context, leage, footboalconnectonInfo);
      //CosmosDB用のデータオブジェクトの定義
      let item: Iitem = {
        "id": leage,
        "data": standings
      }
      //ランキングデータを削除＋登録で更新する。初回更新時は削除対象データが存在しないため、404NotFoundを許容する。
      try {
        await container.item(leage, leage).delete()
      } catch (err) {
        switch (err.code) {
          case 404:
            context.log.error(leage, ":の削除対象が存在しませんでした。処理を続行します。errの内容:" + err);
            break;
          case 429:
            context.log.error(leage, ":の削除処理で429TooManyReqestが発生しました。処理を続行します。errの内容:" + err);
            break;
          default:
            context.log.error(leage, ":の削除処理で失敗しました。" + err);
            throw err;
        }
      };
      try {
        await container.items.create(item);
        context.log.info(leage + ":のCosmosDB登録処理が完了しました");
      } catch (err) {
        switch (err.code) {
          case 429:
            context.log.error(leage, ":の登録処理で429TooManyReqestが発生しました。処理を続行します。errの内容:" + err);
            break;
          default:
            context.log.error(leage, ":の更新処理で失敗しました。errの内容:" + err);
            throw err;
        }
      };
    }

  } catch (err) {
    context.log.error("処理にエラーが発生しました。" + err);
  }
};

async function footBallorgDataGet(context: Context, leage: string, footboalconnectonInfo:footboalconnectonInfo): Promise<Array<object>> {
  //APIのリクエスト
  const url: string = footboalconnectonInfo.urlPrefixes + leage + footboalconnectonInfo.urlSuffixes
  try {
    const response: any = await axios.get(url, { headers: { 'X-Auth-Token': footboalconnectonInfo.token } })
    return response.data.standings[0].table;
  } catch (err) {
    switch (err.response.status) {
      case 429:
        context.log.error(leage, ":のfootball-dataの取得処理で429TooManyReqestが発生しました。処理を終了させます。errの内容:" + err);
        throw err;
      default:
        context.log.error(leage, ":のfootball-dataの取得処理で失敗しました。処理を終了させます。errの内容:" + err);
        throw err;
    }

  }
};

export default timerTrigger;
