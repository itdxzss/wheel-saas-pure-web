<script setup lang="ts">
import {
  ArrowLeft,
  Iphone,
  Lock,
  Monitor,
  MoreFilled,
  Plus
} from "@element-plus/icons-vue";

const emit = defineEmits<{
  back: [];
  connect: [];
  selectDevice: [];
}>();
</script>

<template>
  <section class="devices-page">
    <header class="devices-header">
      <el-button text aria-label="返回奖励页面" @click="emit('back')">
        <el-icon><ArrowLeft /></el-icon>
      </el-button>
      <strong>关联设备</strong>
      <el-button text aria-label="更多操作">
        <el-icon><MoreFilled /></el-icon>
      </el-button>
    </header>

    <div class="devices-hero">
      <div class="linked-illustration" aria-hidden="true">
        <el-icon class="phone"><Iphone /></el-icon>
        <span class="link-line" />
        <el-icon class="monitor"><Monitor /></el-icon>
        <span class="heart">♥</span>
      </div>
      <p>
        在与该账户关联的其他设备上使用 WhatsApp。
        <el-link type="primary" :underline="false">了解更多</el-link>
      </p>
    </div>

    <el-button class="connect-button" type="success" @click="emit('connect')">
      <el-icon><Plus /></el-icon>
      连接设备
    </el-button>

    <div class="device-section">
      <h2>设备状态</h2>
      <p>点击设备登出。</p>
      <el-button class="device-row" text @click="emit('selectDevice')">
        <span class="opera-logo" aria-hidden="true">O</span>
        <span class="device-copy">
          <strong>Opera (iOS)</strong>
          <small>今天最后一次活跃于 3:48 PM</small>
        </span>
      </el-button>
    </div>

    <footer class="encryption-note">
      <el-icon><Lock /></el-icon>
      <span>
        你的私人留言是
        <el-link type="primary" :underline="false">端到端加密</el-link>
        在你所有设备上。
      </span>
    </footer>
  </section>
</template>

<style scoped>
.devices-page {
  min-height: 100vh;
  color: #273238;
  background: #fff;
}

.devices-header {
  display: grid;
  grid-template-columns: 48px 1fr 48px;
  align-items: center;
  min-height: 66px;
  padding: 0 10px;
  border-bottom: 1px solid #eef1f2;
}

.devices-header strong {
  font-size: 20px;
}

.devices-header .el-button:last-child {
  justify-self: end;
}

.devices-header .el-icon {
  font-size: 23px;
}

.devices-hero {
  display: grid;
  place-items: center;
  padding: 52px 18px 24px;
  text-align: center;
}

.linked-illustration {
  position: relative;
  display: flex;
  align-items: end;
  justify-content: center;
  width: 180px;
  height: 104px;
  color: #23c96f;
}

.linked-illustration .phone {
  font-size: 78px;
}

.linked-illustration .monitor {
  font-size: 100px;
}

.link-line {
  width: 20px;
  margin-bottom: 24px;
  border-top: 2px dashed currentcolor;
}

.heart {
  position: absolute;
  top: 0;
  left: 51%;
  font-size: 25px;
}

.devices-hero p {
  margin: 18px 0 0;
  color: #758087;
}

.connect-button {
  width: calc(100% - 24px);
  min-height: 50px;
  margin: 0 12px;
  font-size: 16px;
  font-weight: 800;
  background: #08ad86;
  border: 0;
  border-radius: 999px;
}

.device-section {
  padding: 28px 14px 10px;
}

.device-section h2 {
  margin: 0;
  font-size: 16px;
  color: #078d75;
}

.device-section > p {
  margin: 8px 0 15px;
  color: #78858b;
}

.device-row {
  display: flex;
  justify-content: flex-start;
  width: 100%;
  height: auto;
  padding: 14px 8px;
  color: #26343b;
  border-radius: 14px;
}

.device-row:hover {
  background: #f5faf8;
}

.opera-logo {
  display: grid;
  flex: 0 0 48px;
  place-items: center;
  width: 48px;
  height: 48px;
  margin-right: 14px;
  font-family: Georgia, serif;
  font-size: 45px;
  font-weight: 700;
  line-height: 1;
  color: #df2634;
}

.device-copy {
  display: flex;
  flex-direction: column;
  gap: 5px;
  align-items: flex-start;
}

.device-copy strong {
  font-size: 16px;
}

.device-copy small {
  color: #7b888e;
}

.encryption-note {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 22px;
  font-size: 13px;
  color: #728087;
}

.encryption-note .el-icon {
  flex: 0 0 auto;
}

@media (width <= 520px) {
  .devices-hero {
    padding-top: 34px;
  }
}
</style>
