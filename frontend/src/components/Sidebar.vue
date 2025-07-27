<template >
    <div class="box">
        <button @click="iscollapsed" class="btn_size"><i :class="{'bi bi-arrow-left-square':!this.collapsed,'bi bi-arrow-right-square':this.collapsed}" class="bi bi-arrow-left-square"></i></button>
        <div class="box_top">
            <img src="../assets/logo.svg"  alt="C-trans logo"  :class="{'img_logo':~this.collapsed,'img_logo2':this.collapsed}" >
            <router-link to="/lids" class="link" ><button class="btn btn-outline-primary"><i class=" icons bi bi-file-text"></i> <span v-if="!this.collapsed">Lidlar</span></button></router-link>
            <router-link to="/buyurtmalar" class="link"><button class="btn btn-outline-primary"><i class="icons  bi bi-cart3"></i><span  v-if="!this.collapsed">Kutilayotgan buyumlar</span></button></router-link>
            <router-link to="/jonatma" class="link"><button class="btn btn-outline-primary"><i class="icons bi bi-truck"></i><span v-if="!this.collapsed">Jo'natmalar</span> </button></router-link>
            <router-link to="/users" class="link"><button class="btn btn-outline-primary"><i class="icons bi bi-person"></i> <span v-if="!this.collapsed"> Foydalanuvchilar</span></button></router-link>
            <router-link to="/comment" class="link"><button class="btn btn-outline-primary"><i class="icons bi bi-chat-left"></i> <span v-if="!this.collapsed">Sharhlar</span> </button></router-link>
            <div class="btn-group" role="group">
    <button type="button" class="btn btn-primary " data-bs-toggle="dropdown" aria-expanded="false">
        <i class="icons bi bi-gear"></i> <span v-if="!this.collapsed">Sozlamalar</span> 
    </button>
    <ul class="dropdown-menu">
      <router-link to="/admins" class="link btn"><button class="btn btn-outline-primary"><i class=" bi  bi-person-gear "></i> <span v-if="!this.collapsed">Adminlar</span> </button></router-link>
      <router-link to="/banner" class="link btn"><button class="btn btn-outline-primary"><i class=" bi  bi-phone"></i> <span v-if="!this.collapsed">Mobil Banner</span> </button></router-link>
    </ul>
  </div>
</div>
<button class="box_botton bnt btn-outline-danger"><i class="exit_button bi fs-3 bi-box-arrow-right"><span v-if="!this.collapsed">Chiqish</span> </i></button>
    </div>
</template>
<script>
import store from '@/store';
import { RouterLink,RouterView } from 'vue-router';
export default {
    data(){
        return{
            collapsed:true,
            person:{
                age:23,
                name:'nomalum',
                jinsi:'nomalum'
            }
        }
    },
    methods:{
        iscollapsed(){
            // console.log(store.state.isCollapsed,'side1');
            store.state.isCollapsed = !store.state.isCollapsed
            this.collapsed = store.state.isCollapsed
            // console.log(store.state.isCollapsed,'side2');
        }
    }
}
</script>
<style scoped>
.box{
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: start;
    width: 240px;
    padding: 20px 16px;
    height: 100vh;
    border-right: 1px solid rgb(214, 214, 214);
    overflow: hidden;
}
.box_top{
    display: flex;
    flex-direction: column;
    align-items: start;
    justify-content: center;

}
.box_top img{
    cursor: pointer;
    
}



.box_botton{
    display: flex;
    justify-content: center;
    align-items: center;
    width: 15vh;
}
.btn{
    width: 100%;
    margin-bottom: 10px;
    border: none;
    padding: 6px 18px;
    /* height: 35px; */
    background: none;
    color:#0d6efd;
    display: flex;
    align-items: center;
    justify-content: start;
    color: rgb(117, 117, 117);
    text-decoration: none;
}
.bnt{
    border-radius: 5px;
    
    border: none;
    padding: 6px 18px;
    /* height: 35px; */
    background: none;
    color:#0d6efd;
    display: flex;
    align-items: center;
    justify-content: start;
    color: rgb(117, 117, 117);
    text-decoration: none;
}
.btn:hover, .bnt:hover{
    background-color: rgb(230, 230, 230);
    color:#0d6efd;
}
.btn:focus ,.bnt:focus{
    background-color: rgb(230, 230, 230);
    color:#0d6efd;
}

.dropdown-menu {
    border: none;
    background:none;
    margin: 0 0 0 8px!important;
    width: 150px;
}

.icons{
    color: rgb(117, 117, 117);
    font-size: 25px;
    /* margin-right: 10px; */
}
button span {
    margin-left: 10px;
    text-align: start;
} 
button{
padding: 0;
}
a{
    padding: 0;
}
button i{
    width: 2vh;
    font-size: 20px !important;
}
.btn_size{
    top: -85px;
    right: -2px;
    position: absolute;
    display: flex;
    justify-content: end;
    margin-top: 100px;
    font-size: 19px;
    border: none;
    background-color: #ffff;
    z-index: 1;

}
.link{
    text-decoration: none;
}
.dropdown-item{
    width: 19%;
    border-radius: 5px;
}
.img_logo{
    width: 200px;
    height: 100px;
}
.img_logo2{
    width: 70px;
    height: 20px;
    margin: 25px 0 45px 0px;
}
.setting_icon{
    margin-right: 10px;
    width: 100px;
}
ul{
    margin-left: 0;
}
span{
    width: 140px;
    display: flex;
    justify-content: start;
}

.exit_button{
    width: 2vh;
    font-size: 20px !important;
}

</style>