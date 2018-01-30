/**
 * Created by Administrator on 2017/8/11.
 */
// 请求登录接口
function callLoginLogic() {
    // 检查表单数据
    var username = $('.username').val()
   /* if (Utils.isEmpty(username)) {
        $("em[for='email']").text('请输入邮箱')
        $('#username').focus()
        return
    } else if(!Utils.isEmail(username)) {
        $("em[for='email']").text('邮箱格式不对，请输入正确的邮箱')
        $('#username').focus()
        return
    } else {
        $("em[for='email']").text('')
    }*/
    var password = $('.password').val()
    /*if (Utils.isEmpty(password)) {
        $("em[for='Pwd']").text('请输入密码')
        $('#password').focus()
        return
    }else {
        $("em[for='Pwd']").text('')
    }*/
    var data = {'username':username, 'password':password}
    console.log("data",data)
    $.ajax({
        url: '/admin/login.html',
        type: 'post',
        data: data,
        dataType: 'json',
        beforeSend: function() {
            Utils.setLoading('正在登录中, 请稍候...')
            $("#btnLogin").attr('disabled', 'disabled')
        },
        complete: function() {
            Utils.hideLoading()
            $('#btnLogin').removeAttr('disabled')
        },
        success: function(res) {
            var callback = function () {
                if(res.state == 1 && res.data) {
                    console.log("data",res.data)
                    if(!Utils.isEmpty(res.data.redirect)){
                        window.location.href = res.data.redirect
                    }
                } else {

                }
            }
            Utils.showMessage(res.message, callback)
        },
        error: function(xhr, ajaxOptions, thrownError) {
            console.error(thrownError + "\r\n" + xhr.statusText + "\r\n" + xhr.responseText)
            Utils.showMessage('抱歉, 请求服务器失败[ref:' + xhr.statusText + ']', 1)
        }
    })
}
$('.btn').click(function () {
    // 请求api
    callLoginLogic()

})