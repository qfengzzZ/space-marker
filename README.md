# space-maker
## a tool for mark on the picture
## 一个在图片上标注点或者范围的工具
## 如何使用
## how to use
<script setup>
    const drawRef = ref(null)
    const drawCanvas = ref(null)
    drawCanvas.value = new SpaceMaker(drawRef.value, {
       marks: [
         {
           center: {
             x: 500,
             y: 550
           },
           padding: 0,
           radius: 12,
           highlight: false,
           icon: 'device_normal', // 我这里使用的是内置的资源，可以用网络地址的图片
           ext: null
         }
       ],
   ranges: [
     {
         bgColor: #000,
         points: [], // 二维数组
         ext: {}
     },
   mapImgUrl: 图片地址
})
</script>
<template>
   <div>
     <div ref="drawRef" class="space"></div>
   </div>
</template>
<style lang="scss" scoped>
   .space {
     width: 100%;
     height: 100vh;
   }
</style>