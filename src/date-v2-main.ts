import { createApp } from "vue";
import {
  ElButton,
  ElDialog,
  ElDrawer,
  ElForm,
  ElFormItem,
  ElInput,
  ElProgress,
  ElResult,
  ElScrollbar,
  ElSkeleton
} from "element-plus";
import PublicPromotionApp from "@/views/buyer/public-promotion/index.vue";
import { resolveDateV2PathPromotionCode } from "@/views/buyer/date-v2-preview/domain/date-v2-preview";
import "element-plus/dist/index.css";
import "@/views/buyer/date-v2-preview/public-entry.scss";

const promotionCode = resolveDateV2PathPromotionCode(window.location.pathname);
const app = createApp(PublicPromotionApp, {
  promotionCode
});

app
  .use(ElButton)
  .use(ElDialog)
  .use(ElDrawer)
  .use(ElForm)
  .use(ElFormItem)
  .use(ElInput)
  .use(ElProgress)
  .use(ElResult)
  .use(ElScrollbar)
  .use(ElSkeleton)
  .mount("#date-v2-app");
