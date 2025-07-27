<template >
    <div class="box">
        <div class="table_box">
            <section class="header">
            <h1>Мобильные баннеры</h1>
            <p>Макс. 3 изображения. Рекомендуемый размер: 320x180 px</p>
            <div class="img_section">
                <img src="@/assets/logo.svg" class="img" alt="img">
                <img src="@/assets/logo.svg" class="img" alt="img">
            </div>
        </section>
        </div>
    </div>
</template>
<script>
import store from '@/store';

export default {
    mounted(){
        store.state.sideNav="Banner"
    }
}
</script>
<style scoped>
    .box{
    padding: 20px;
    display: inline-block;
    
}
.table_box{
    background-color: #ffff;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
    padding: 20px;
    border-radius: 16px;
}
.header{
    display: flex;
    flex-direction: column;
    width: 100%;
}
.header h1{
    font-size: 36px;
}
.header p{
    font-size: 20px;
}
.img_section{
    width: 100%;
    height: 100%;
}
.img{
    width: 49%;
    height: 450px;
    border-radius: 20px;
    cursor:pointer;
    border: 1px solid;
    margin-right: 15px;
}
</style>