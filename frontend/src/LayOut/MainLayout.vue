<template >
    <div class="box">
        <div class="bar">
            <Sidebar :class="{'sidebar1':$store.state.isCollapsed,'sidebar':!$store.state.isCollapsed}"/>
        </div>
        <div class="bar_content">
            <Navbar class="navbar"/>
            <router-view class="content"/>
        </div>
        

    </div>
</template>
<script>
import { RouterLink, RouterView } from 'vue-router';
import Dashboard from '@/views/Dashboard.vue';
import Sidebar from '@/components/Sidebar.vue'
import Navbar from '@/components/Navbar.vue'
import store from "@/store/index";
export default {
    data(){
        return{
        }
    },
    components:{
        Sidebar,
        Navbar,
        Dashboard,
    },
}
</script>
<style scoped>




.box{
        display: flex;
        width: 100%;
        
        /* overflow: hidden; */
        
    }
    .bar{
        display: flex;
    }
    .sidebar{
        transition: 0.5s;
        width: 26.5vh;
    }
    .sidebar1{
        transition: 0.5s;
        width:10vh;
    }
    .bar_content{
        display: flex;
        flex-direction: column;
        width: 100%;
      
       
    }
    .navbar{
        
        height: 55px;
    }
    .content{
        position: relative;
     background-color: #f5f5f5;
        z-index: 1;
    }
    .dropdown-menu {
  position: absolute;
  z-index: 9999!important;
  background-color: white;
  box-shadow: 0 0 10px rgba(0,0,0,0.1);
  padding: 5px 0;
  border-radius: 6px;
}
</style>