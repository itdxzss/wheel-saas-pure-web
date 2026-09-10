import { createApp } from "vue";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import { setupStore } from "../../../src/store";
import Fixture from "./Fixture.vue";
const app = createApp(Fixture);
setupStore(app);
app.use(ElementPlus).mount("#app");
