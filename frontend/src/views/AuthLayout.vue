<template>
    <div>
      <div class="box">
        <div class="title">Tizimga kirish</div>
  
        <!-- Ism kirish input -->
        <input
          type="text"
          class="name"
          v-model="name"
          placeholder="Login"
          autocomplete="username"
          @keyup.enter="login1"
        />
  
        <!-- Parol input va ko‘zcha -->
        <div class="password-wrapper">
          <input
          :type="showPassword ? 'text' : 'password'"
            v-model="password"
            placeholder="Parolingiz"
            autocomplete="current-password"
            @keyup.enter="login1"
            />
            <button type="button" class="eye "  @click="togglePassword">
              <i class="" :class="{'bi bi-eye':showPassword,'bi bi-eye-slash':!showPassword}"></i>
            </button>
        </div>
  
        <p v-if="error" class="error">{{ error }}</p>

        <!-- Kirish tugmasi -->
        <button class="btn btn btn-outline-primary" type="button" :disabled="loading" @click="login1" >
          {{ loading ? 'Kirilmoqda...' : 'Kirish' }}
        </button>
      </div>
    </div>
  </template>
  
  <script>
import { ref } from 'vue'
import { api, errorMessage } from '@/api'
  import { useRouter } from 'vue-router'
  
  export default {
    setup() {
      const router = useRouter()
  
      const name = ref('')
      const password = ref('')
      const showPassword = ref(false)
      const loading = ref(false)
      const error = ref('')
  
      const togglePassword = () => {
        showPassword.value = !showPassword.value
      }
  
      const login1 = async () =>{
        error.value = ''
        if (!name.value.trim() || !password.value) {
          error.value = "Login va parolni to‘ldiring"
          return
        }
        loading.value = true
        try {
          const response = await api.post('/auth/login/admin',{
            username: name.value.trim(),
            password: password.value
          })

          const token = response.data.token
          if (!token) throw new Error("Serverdan token kelmadi")
          localStorage.setItem('token',token)
          router.push('/dashboard')
        }catch(e){
          error.value = errorMessage(e)
        } finally {
          loading.value = false
        }
      }


      
  
      return {
        login1,
        name,
        password,
        showPassword,
        togglePassword,
        loading,
        error,
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
  
  .error {
    color: #dc3545;
    font-size: 14px;
    margin: 5px 0 0;
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