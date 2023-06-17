import isUrl from 'is-url'
//var urlWithoutProtocol = /([a-zA-Z]|\.|\d)*([a-zA-Z]|\d)+\.([a-zA-Z]|\d)+([a-zA-Z]|.|\d)*/
const unibox={
    input:(url,search)=>{
        var list = []
        if(isUrl(url)){
            list.push(url)
        }else if (isUrl('http://'+url)) {
            list.push("http://" + url)
        }else if(url.substr(0,6)=='about:'){
            list.push(url)
        }
        else if(url!=''){
            list.push(search + encodeURIComponent(url))
        }else{
            list.push('about:blank')
        }
        return list
    }
}
export default unibox