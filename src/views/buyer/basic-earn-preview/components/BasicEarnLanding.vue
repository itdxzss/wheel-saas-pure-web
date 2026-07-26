<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";

defineProps<{
  showAppDownload: boolean;
}>();

const emit = defineEmits<{
  claim: [];
}>();

interface RewardComment {
  id: number;
  name: string;
  message: string;
  time: string;
  initials: string;
  color: string;
}

const commentPool: RewardComment[] = [
  {
    id: 1,
    name: "Mia ***",
    message: "刚收到我的奖励。强烈推荐！",
    time: "2分钟前",
    initials: "M",
    color: "#c08c6c"
  },
  {
    id: 2,
    name: "C. Nguyen",
    message: "我只花了一分钟，难得的经历！",
    time: "3分钟前",
    initials: "C",
    color: "#97658a"
  },
  {
    id: 3,
    name: "Sarah ***",
    message: "超级简单！不到两分钟就拿到奖励了。",
    time: "刚才",
    initials: "S",
    color: "#68736b"
  },
  {
    id: 4,
    name: "M. Ahmed",
    message: "效果很好，我一开始还将信将疑，但这是真的！",
    time: "刚才",
    initials: "A",
    color: "#66858a"
  },
  {
    id: 5,
    name: "Jessica T.",
    message: "刚收到我的奖励。流程很清楚。",
    time: "刚才",
    initials: "J",
    color: "#5d7e8e"
  },
  {
    id: 6,
    name: "Olivia R.",
    message: "验证完成后马上就解锁了，推荐。",
    time: "刚刚",
    initials: "O",
    color: "#8b765f"
  }
];

const visibleComments = ref(commentPool.slice(0, 5));
let rotationTimer: ReturnType<typeof setInterval> | undefined;
let poolCursor = 5;

onMounted(() => {
  rotationTimer = setInterval(() => {
    const next = {
      ...commentPool[poolCursor % commentPool.length],
      id: Date.now(),
      time: "刚刚"
    };
    visibleComments.value = [next, ...visibleComments.value.slice(0, 4)];
    poolCursor += 1;
  }, 4200);
});

onBeforeUnmount(() => {
  if (rotationTimer) clearInterval(rotationTimer);
});
</script>

<template>
  <div class="reward-page">
    <div class="year-watermark" aria-hidden="true">2026</div>
    <header class="reward-header">
      <div class="brand">
        <span class="brand__icon">★</span>
        <strong>RewardClub</strong>
      </div>
      <span class="live-badge"><i />现场活动</span>
    </header>

    <section class="reward-card">
      <div class="reward-card__topline" />
      <div class="reward-card__tags">
        <span class="trophy">🏆</span>
        <span class="selected">精选</span>
      </div>
      <p class="congratulation">恭喜你！</p>
      <h1>你离领取奖励只差一步了！</h1>
      <p class="description">
        为防止重复申诉，请通过 WhatsApp 验证。一旦验证，奖励即刻归你所有。
      </p>
      <ul class="benefits">
        <li><span>✓</span>验证后即时奖励送达</li>
        <li><span>✓</span>您的信息永远不会被存储或共享</li>
        <li><span>✓</span>端到端加密连接</li>
      </ul>
      <p class="fine-print">（验证仅确认你是真实用户，不会存储任何数据。）</p>
    </section>

    <section class="comments-panel" aria-live="polite">
      <div class="comments-title">
        <strong><i />现场评论</strong>
        <span>实时更新</span>
      </div>
      <TransitionGroup name="comment" tag="div" class="comment-list">
        <article
          v-for="comment in visibleComments"
          :key="comment.id"
          class="comment-item"
        >
          <div
            class="avatar"
            :style="{ background: comment.color }"
            aria-hidden="true"
          >
            {{ comment.initials }}
          </div>
          <div class="comment-copy">
            <div class="comment-meta">
              <strong>{{ comment.name }}</strong>
              <span>{{ comment.time }}</span>
            </div>
            <div class="stars">★★★★★</div>
            <p>“{{ comment.message }}”</p>
            <span class="claimed">✓ 领取奖励</span>
          </div>
        </article>
      </TransitionGroup>
    </section>

    <section v-if="showAppDownload" class="download-strip">
      <span>在手机上继续</span>
      <button type="button"> App Store</button>
      <button type="button">▶ Google Play</button>
    </section>

    <div class="bottom-space" />
    <footer class="claim-bar">
      <el-button type="primary" @click="emit('claim')">
        <span>★</span>领取我的奖励
      </el-button>
    </footer>
  </div>
</template>

<style scoped>
.reward-page {
  position: relative;
  width: min(100%, 520px);
  min-height: 100vh;
  padding: 14px 18px 0;
  margin: 0 auto;
  overflow: hidden;
  background:
    radial-gradient(
      circle at 50% 8%,
      color-mix(in srgb, var(--earn-theme) 7%, transparent),
      transparent 35%
    ),
    #fbf7ef;
}

.year-watermark {
  position: fixed;
  top: 44%;
  left: 50%;
  z-index: 0;
  font-size: clamp(160px, 34vw, 270px);
  font-weight: 900;
  line-height: 0.8;
  color: rgb(72 58 41 / 5%);
  pointer-events: none;
  transform: translate(-50%, -50%);
}

.reward-header,
.reward-card,
.comments-panel,
.download-strip {
  position: relative;
  z-index: 1;
}

.reward-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 4px 14px;
  border-bottom: 1px solid #ebe3d6;
}

.brand {
  display: flex;
  gap: 10px;
  align-items: center;
  font-size: 19px;
}

.brand__icon {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  color: #fff;
  background: var(--earn-theme);
  border-radius: 11px;
  box-shadow: 0 7px 18px color-mix(in srgb, var(--earn-theme) 25%, transparent);
}

.live-badge,
.selected {
  padding: 5px 11px;
  font-size: 12px;
  font-weight: 700;
  color: #239b55;
  background: #e9f8ee;
  border: 1px solid #cbeed6;
  border-radius: 999px;
}

.live-badge i,
.comments-title i {
  display: inline-block;
  width: 7px;
  height: 7px;
  margin-right: 6px;
  background: #20b15a;
  border-radius: 50%;
  animation: pulse 1.6s infinite;
}

.reward-card {
  padding: 24px;
  margin-top: 18px;
  overflow: hidden;
  background: rgb(255 255 255 / 92%);
  border: 1px solid #e1d7c7;
  border-radius: 28px;
  box-shadow: 0 18px 45px rgb(78 60 34 / 10%);
}

.reward-card__topline {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 5px;
  background: var(--earn-theme);
}

.reward-card__tags {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.trophy {
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
  font-size: 27px;
  background: color-mix(in srgb, var(--earn-theme) 14%, #fff7e8);
  border: 1px solid color-mix(in srgb, var(--earn-theme) 45%, #f1dfc0);
  border-radius: 16px;
}

.congratulation {
  margin: 18px 0 4px;
  font-size: 13px;
  font-weight: 800;
  color: var(--earn-theme);
}

.reward-card h1 {
  margin: 0;
  font-size: clamp(25px, 6vw, 32px);
  line-height: 1.25;
}

.description {
  margin: 17px 0;
  line-height: 1.75;
  color: #7e756c;
}

.benefits {
  padding: 0;
  margin: 0;
  list-style: none;
}

.benefits li {
  display: flex;
  gap: 10px;
  align-items: center;
  margin: 11px 0;
  font-size: 14px;
}

.benefits span {
  display: grid;
  place-items: center;
  width: 21px;
  height: 21px;
  font-weight: 800;
  color: #20a856;
  background: #e5f8ea;
  border-radius: 50%;
}

.fine-print {
  margin: 18px 0 0;
  font-size: 11px;
  color: #aaa095;
  text-align: center;
}

.comments-panel {
  margin-top: 22px;
}

.comments-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.comments-title i {
  background: #ff4c54;
}

.comments-title span {
  font-size: 12px;
  color: #aaa095;
}

.comment-list {
  overflow: hidden;
  background: rgb(255 255 255 / 88%);
  border: 1px solid #e5ded3;
  border-radius: 22px;
  box-shadow: 0 12px 30px rgb(78 60 34 / 7%);
}

.comment-item {
  display: flex;
  gap: 13px;
  padding: 16px;
  border-bottom: 1px solid #eee8df;
  transition: all 0.45s ease;
}

.comment-item:last-child {
  border-bottom: 0;
}

.avatar {
  display: grid;
  flex: 0 0 43px;
  place-items: center;
  width: 43px;
  height: 43px;
  font-weight: 800;
  color: #fff;
  border: 3px solid #fff;
  border-radius: 50%;
  box-shadow: 0 3px 8px rgb(0 0 0 / 16%);
}

.comment-copy {
  flex: 1;
  min-width: 0;
}

.comment-meta {
  display: flex;
  justify-content: space-between;
}

.comment-meta span {
  font-size: 11px;
  color: #b1a89e;
}

.stars {
  margin-top: 3px;
  font-size: 11px;
  color: #ffb000;
  letter-spacing: 2px;
}

.comment-copy p {
  margin: 6px 0;
  font-size: 13px;
  line-height: 1.5;
}

.claimed {
  font-size: 11px;
  font-weight: 700;
  color: #22a65a;
}

.download-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  padding: 14px;
  margin-top: 16px;
  background: #fff;
  border: 1px solid #e6ded2;
  border-radius: 16px;
}

.download-strip span {
  flex: 1 0 100%;
  font-size: 12px;
  color: #8e8478;
}

.download-strip button {
  flex: 1;
  padding: 9px;
  color: #fff;
  background: #24211e;
  border: 0;
  border-radius: 9px;
}

.bottom-space {
  height: 105px;
}

.claim-bar {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 5;
  padding: 14px max(18px, calc((100vw - 484px) / 2));
  background: linear-gradient(transparent, #fbf7ef 26%);
}

.claim-bar .el-button {
  width: 100%;
  min-height: 58px;
  font-size: 18px;
  font-weight: 900;
  color: #2b2115;
  background: var(--earn-theme);
  border: 0;
  border-radius: 999px;
  box-shadow: 0 14px 30px color-mix(in srgb, var(--earn-theme) 36%, transparent);
}

.claim-bar span {
  margin-right: 9px;
}

.comment-enter-active,
.comment-leave-active {
  transition: all 0.45s ease;
}

.comment-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}

.comment-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

@keyframes pulse {
  50% {
    box-shadow: 0 0 0 5px rgb(32 177 90 / 12%);
  }
}

@media (width <= 420px) {
  .reward-page {
    padding-inline: 12px;
  }

  .reward-card {
    padding: 20px;
    border-radius: 22px;
  }
}
</style>
