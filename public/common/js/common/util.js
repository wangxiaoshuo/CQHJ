/**
 * Created by Administrator on 2017/8/11.
 */

function getUrlParams(url ,name) {
    var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
    var r = url.substr(1).match(reg);
    if (r != null) return unescape(r[2]); return null;
}
