import { createStore} from 'vuex'

const store = createStore({
    state(){
        return {
            isCollapsed:true,
            count:0,
            user:null
        }
    },
    mutations:{
        toggleSidebar(state){
            state.isCollapsed = !state.isCollapsed
        }
    }
})

export default store
