const API_KEY = "NULL"
const baseURL = 'https://www.googleapis.com/youtube/v3/search'
class Model {
    constructor() {
        this.youtube_list = JSON.parse(localStorage.getItem('youtube_list')) || []
    }

    // 綁定 Controller 功能 
    bindYoutubeListChanged(callback) {
        this.onYoutubeListChanged = callback
    }

    //  本地資料與localStorage設定
    _commit(youtube_list) {
        console.log('old')
        this.onYoutubeListChanged(youtube_list)
        localStorage.setItem('youtube_list', JSON.stringify(youtube_list))
    }

    // 搜尋關鍵字
    searchYoutube(youtube_text) {
        let vm = this;
        $.ajax({
            method: "GET",
            url: baseURL,
            data: { 
                key:API_KEY,
                q: youtube_text, 
                part: 'snippet', // 定義要取得的資料範圍
                maxResults: 5 // 預設為 5 。 可選 0～50。
            }
        }).done(function (res) {
            console.log(res)
            vm.youtube_list = res.items
            vm._commit(vm.youtube_list)
        });
    }
}

class View {
    constructor() {
        let str = ''
        // ========== Element ==========
        this.app = this.getElement('#root')
        this.app.classList.add("container")
        this.form = this.createElement('form')
        this.form.classList.add("row")
        this.menu = this.createElement('div')
        this.menu.classList.add("row")        
        // ========== Element End ==========


        // Search Bar
        str = `
            <div class="form-group">
                <input type="text" placeholder="請輸入搜尋文字" class="form-control" name="youtube_text">
                <button type="submit" class="btn btn-primary float-end clearfix mt-2">搜尋</button>
            </div>
        `
        this.form.innerHTML = str
        // Title
        this.title = this.createElement('div','text-center')
        this.title_text = this.createElement('h1')
        this.title_text.textContent = 'Youtube API'
        this.title_text.style.display = "inline-block"
        this.title_icon = this.createElement('i')
        this.title_icon.classList.add("fa", "fa-youtube-play")
        this.title_icon.style.color = "red"
        this.title_icon.style.fontSize = "48px"
        this.title_icon.style.display = "inline-block"
        this.title.insertAdjacentElement("afterbegin", this.title_icon)
        this.title.insertAdjacentElement("beforeend", this.title_text)
        // Youtube View Left
        this.menu_lf = this.createElement('div')
        this.menu_lf.classList.add('col-sm-12', 'col-md-8', 'mt-3')
        str = `
            <div class="row">
                <div class="col-12 embed-container">
                    ... Loading
                </div>
                <div class="col-12 p-0 mt-2">  
                    <div class="card p-2 vd__title">
                    請先搜尋關鍵字
                    </div>
                </div>
            </div>
            
        `
        this.menu_lf.innerHTML = str
        // Youtube View Right
        this.menu_rg = this.createElement('div')
        this.menu_rg.classList.add('col-sm-12', 'col-md-4', 'mt-3')
        str = `
        <div class="list-group playlist"></div>`
        this.menu_rg.innerHTML = str

        this.menu.append(this.menu_lf, this.menu_rg)
        this.app.append(this.title, this.form, this.menu)

        this.ytList = this.getElement('.playlist')
        this.input = this.getElement('input')
        this.video = this.getElement('.embed-container')
        this.video_title = this.getElement('.vd__title')

    }

    // 取得搜尋欄位內容
    get _youtubeText() {
        return this.input.value
    }

    // 清除輸入
    _resetInput() {
        this.input.value = ''
    }

    // 新建元素跟class
    createElement(tag, className) {
        const element = document.createElement(tag)
        if (className) element.classList.add(className)
        return element
    }

    // 取得dom
    getElement(selector) {
        const element = document.querySelector(selector)
        return element
    }

    // 渲染整個畫面
    displayYoutubes(youtube_list) {
        let str =''
        // Delete all nodes
        while (this.ytList.firstChild) {
            this.ytList.removeChild(this.ytList.firstChild)
        }

        // Show default message
        if (youtube_list.length === 0) {
            console.log('here')

            const p = this.createElement('p')
            p.textContent = 'Nothing to Video!'
            this.ytList.append(p)
        } else { 
            // Create nodes
            youtube_list.forEach((item,index) => {
                this.li = this.createElement('div')
                this.li.classList.add('list-group-item','animate__animated','animate__fadeIn',`animate__delay-${index}s`)
                str = `
                    <div class="row">
                        <img class="img-fluid col-sm-6" src="${item.snippet.thumbnails.medium.url}" alt="${item.snippet.title}">
                        <div class="content col-sm-6">
                            <div class="header">${item.snippet.title}</div>
                            
                        </div>
                    </div>
                `
                this.li.innerHTML = str
                // Append nodes
                this.ytList.append(this.li)
                this.li.addEventListener('click', event => {
                    this.video.innerHTML= `<iframe title="viedo player" class="embed-responsive-item" src="https://www.youtube.com/embed/${item.id.videoId}"</iframe>)`
                    this.video_title.innerHTML=`<h4 class="card-body">${item.snippet.channelTitle}</h4><p>${item.snippet.description}</p>`;
                })
            })
            this.video.innerHTML= `<iframe title="viedo player" class="embed-responsive-item" src="https://www.youtube.com/embed/${youtube_list[0].id.videoId}"</iframe>)`
            this.video_title.innerHTML=`<h4 class="card-body">${youtube_list[0].snippet.channelTitle}</h4><p>${youtube_list[0].snippet.description}</p>`;

        }

        // debug ~
        console.log(youtube_list)
    }

    // 搜尋按鈕功能
    bindSearchYoutube(handler) {
        this.form.addEventListener('submit', event => {
            event.preventDefault()
            if (this._youtubeText) {
                handler(this._youtubeText)
                this._resetInput()
            }
        })
    }

}


class Controller {
    constructor(model, view) {
        this.model = model
        this.view = view

        // Explicit this binding
        this.model.bindYoutubeListChanged(this.onYoutubeListChanged)
        this.view.bindSearchYoutube(this.handleSearchYoutube)

        // 初始化畫面
        // 初始化 Model 時 localStorage 有上一次搜尋的資料 .
        this.onYoutubeListChanged(this.model.youtube_list)
    }

    // 資料畫面選染
    onYoutubeListChanged = youtube_list => {
        this.view.displayYoutubes(youtube_list)

    }

    // 搜尋關鍵字
    handleSearchYoutube = youtube_Text => {
        this.model.searchYoutube(youtube_Text)
    }

    // 影片選擇
    handleChangeYoutube = id => {
        this.model.changeYoutube(id)
    }
}

const app = new Controller(new Model(), new View())