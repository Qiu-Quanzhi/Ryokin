var urlWithoutProtocol = /([a-zA-Z]|\.|\d)*([a-zA-Z]|\d)+\.([a-zA-Z]|\d)+([a-zA-Z]|.|\d)*/
const unibox={
    input:(url,search)=>{
        var list = []
        console.log(urlWithoutProtocol.test(url))
        if (url.search(urlWithoutProtocol)!=-1) {
            if (url.search(urlWithoutProtocol)==0) {
                list.push("http://" + url)
            }else{
                list.push(url)
            }
        }else if(url.substr(0,6)=='about:'){
            list.push(url)
        }
        else{
            list.push(search + encodeURIComponent(url))
        }
        return list
    }
}
export default unibox