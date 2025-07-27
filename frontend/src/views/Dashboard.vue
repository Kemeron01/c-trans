<template >
    <div class="box">
        <div class="top">
            <h2>Admin paneliga xush kelibsiz 👋</h2>
            <p>Siz muvaffaqiyatli tizimga kirdingiz.</p>
        </div>
        <div class="bton">
            <div class="card">
                <i class="bi bi-people"></i>
                <div class="card_title"><p>Lidlar</p><span>12</span></div>
            </div>
            <div class="card">
                <i class="bi bi-file-text"></i>
                <div class="card_title"><p>Buyurtmalar</p><span>12</span></div>
            </div>
            <div class="card">
                <i class="bi bi-truck"></i>
                <div class="card_title"><p>Jo'natmalar</p><span>12</span></div>
            </div>
            <div class="card">
                <i class="bi bi-person"></i>
                <div class="card_title"><p>Foydalanuvchilar</p> <span>12</span></div>
            </div>
        </div>
    </div>
</template>
<script>
import { RouterLink,RouterView } from "vue-router";
export default {
    
}
</script>
<style scoped>
    .box{
        width: 100%;
        height: 100%;
        padding: 60px;
        display: flex;
        flex-direction: column;
        align-items: start;
    }
    .top p{
        font-size: 20px;
        color: rgb(117, 117, 117);
       }
    .bton{
        display: flex;
        padding: 20px 0;
        gap: 20px;
    }
    .bton .card{
        width: 350px;
        height: 130px;
        padding: 0px 0px 0 20px;
        border: none;
        border-radius: 16px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        transition: 0.4s;
        gap: 40px;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: flex-start;
    }
    .card:hover{
        transition: 0.6s;
        box-shadow:  0px 10px 10px rgba(0, 0, 0, 0.4);
        margin-top: -5px;
        /* background-color: aqua; */
    }
    .card .card_title, .bi{
        font-size: 26px;
        display: flex;
        flex-direction: column;
        /* text-align: center; */
    }
    .card .card_title p{
        margin-bottom: 0;
    }
    .card .card_title span{
        color: rgb(117, 117, 117);
    }
    .bi{
        color: #0d6efd;
        border-radius: 20px;
        background-color: rgb(247, 247, 247);
        padding: 15px;
    }
</style>