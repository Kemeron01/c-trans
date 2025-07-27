<template>
    <div>
      <div class="box">
        <div class="title">Tizimga kirish</div>
  
        <!-- Ism kirish input -->
        <input
          type="text"
          class="name"
          v-model="name"
          placeholder="emailingizni kiriting"
        />
  
        <!-- Parol input va ko‘zcha -->
        <div class="password-wrapper">
          <input
          :type="showPassword ? 'text' : 'password'"
            v-model="password"
            placeholder="Parolingiz"
            />
            <button type="button" class="eye "  @click="togglePassword">
              <i class="" :class="{'bi bi-eye':showPassword,'bi bi-eye-slash':!showPassword}"></i>
            </button>
        </div>
  
        <!-- Kirish tugmasi -->
        <button class="btn btn btn-outline-primary" type="button" @click="login1" >Kirish</button>
      </div>
    </div>
  </template>
  
  <script>
  import router from '@/router'
import axios from 'axios'
import { ref } from 'vue'
  import { useRouter } from 'vue-router'
  
  export default {
    setup() {
      const router = useRouter()
  
      const name = ref('')
      const password = ref('')
      const showPassword = ref(false)
  
      const togglePassword = () => {
        showPassword.value = !showPassword.value
      }
  
      const login = () => {
        if (name.value && password.value) {

          // router.push('/app/dashboard')
        } else {
          alert("Ism va parolni to‘ldiring")
        }
      }
      const login1 = async () =>{
        try {
          const response = await axios.post('http://89.169.2.238:8002/api/v1/auth/login/admin',{
            username: name.value,
            password: password.value
          })

          const token = response.data.token
          localStorage.setItem('token',token)
          console.log('token',token);
          router.push('/dashboard')
        }catch(error){
          console.log('ishlamadi', error.response?.data?.message || 'serverga ulanib bolmadi');
        }
      }


      
  
      return {
        login1,
        name,
        password,
        showPassword,
        togglePassword,
        login,
      }
    },
    data(){
      return{
        eyesOff:""
      }
    },
  }
  </script>
  
  <style scoped>
  .box {
    padding: 20px;
    max-width: 350px;
    margin: 100px auto;
    border: 1px solid #ccc;
    border-radius: 8px;
    box-shadow: 0 0 10px #e0e0e0;
    background-color: white;
  }
  
  .title {
    text-align: center;
    font-weight: bold;
    margin-bottom: 15px;
    font-size: 20px;
  }
  
  input {
    padding: 10px;
    margin: 5px 0;
    width: 100%;
    font-size: 16px;
    border: 1px solid #ccc;
    border-radius: 5px;
  }
  
  .password-wrapper {
    display: flex;
    align-items: center;
    position: relative;
  }
  
  .password-wrapper .eye {
    position: absolute;
    right: 10px;
    background: none;
    border: none;
    font-size: 18px;
    cursor: pointer;
  }
  
  button.btn {
    width: 100%;
    padding: 12px;
    border-radius: 6px;
    font-size: 16px;
    margin-top: 10px;
    cursor: pointer;
  }
  </style>