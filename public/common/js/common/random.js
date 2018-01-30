/**
 * Created by karl on 2017/8/30.
 */

var nametxt = $('.slot')
var winningtxt = $('.name')
var pcount = xinm.length-1;//参加人数
var runing = true;
var trigger = true;
// var inUser = (Math.floor(Math.random() * 10000)) % 3 + 1;
var num = 0;
var name = []

var Randomnumber =  Judgmentumber = 3; //设置单次抽奖人数

$(function () {
    nametxt.css('background-image','url('+xinm[0]+')')
    winningtxt.html(info[0].name)
})

// 开始停止
function start() {

    if($('#quantity').val() != 3) {
        Randomnumber =  Judgmentumber = $('#quantity').val()
    }

    if (runing) {

        if ( pcount <= Randomnumber ) {
            alert("抽奖人数不足3人")
        }else{
            runing = false;
            $('#start').text('停止')
            startNum()
        }

    } else {
        $('#start').text('自动抽取中('+ Randomnumber+')')
        zd()
    }

}

// 开始抽奖

function startLuck() {
    runing = false;
    $('#btntxt').removeClass('start').addClass('stop')
    startNum()
}

// 循环参加名单
function startNum() {
    num = Math.floor(Math.random() * pcount)
    nametxt.css('background-image','url('+xinm[num]+')')
    winningtxt.html(info[num].name)
    t = setTimeout(startNum, 0)
}

// 停止跳动
function stop() {
    pcount = xinm.length-1;
    clearInterval(t)
    t = 0;
}

// 打印抽取人
function zd() {
    if (trigger) {

        trigger = false;
        var i = 0;

        if ( pcount >= Randomnumber ) {
            stopTime = window.setInterval(function () {
                if (runing) {
                    runing = false;
                    $('#btntxt').removeClass('start').addClass('stop')
                    startNum()
                } else {
                    runing = true;
                    $('#btntxt').removeClass('stop').addClass('start')
                    stop()

                    i++;
                    Randomnumber--;

                    $('#start').text('自动抽取中('+ Randomnumber+')')

                    if ( i == Judgmentumber ) {
                        console.log("抽取结束")
                        window.clearInterval(stopTime)
                        $('#start').text("开始")
                        Randomnumber = Judgmentumber;
                        trigger = true;
                    }

                    // if ( Randomnumber == inUser) {
                    //     // 指定抽取人
                    //     nametxt.css('background-image','url(img/7.jpg)')
                    //     winningtxt.html('指定抽取人')
                    //     $('.luck-user-list').prepend("<li><div class='portrait' style='background-image:url(img/7.jpg)'></div><div class='luckuserName'>指定中奖人</div></li>")
                    //     $('.modality-list ul').append("<li><div class='luck-img' style='background-image:url(img/7.jpg)'></div><p>指定中奖人</p></li>")
                    //     inUser = 9999;
                    // }else{
                        //打印抽取者名单
                        $('.luck-user-list').prepend("<li><div class='portrait' style='background-image:url("+xinm[num]+")'></div><div class='luckuserName'>"+info[num].name+"</div><div class='luckuserPhone'>"+info[num].phone+"</div><a class='luckuserbtn' data-index='"+info[num].name+"' onclick='remarkModal(&quot;"+info[num].name+"&quot;)' href='javascript:;' title='忙碌'><i class='Hui-iconfont'>&#xe60b;</i></a></li>")
                        // $('.modality-list ul').append("<li><div class='luck-img' style='background-image:url("+xinm[num]+")'></div><p>"+name[num]+"</p></li>")


                        //将已抽取者从数组中"删除",防止二次抽取
                        xinm.splice($.inArray(xinm[num], xinm), 1)
                        info.splice($.inArray(info[num], info), 1)
                    // };
                }
            },1000)
        }


    }
}


// function remarkModal(){
//     $("#remarkModal").modal("show")
// }

// 取消评分备注
function remarkModal(name){
    console.log("name",name)
    var liIndex
    //通过li获取下标
    var li = document.getElementsByTagName("li");
    for(var i = 0;i < li.length; i++){
        li[i].index = i;
        li[i].onclick = function(){
            console.log(this.index)
            liIndex = this.index
        }
    }

    layer.prompt({title: '填写取消评分备注', formType: 2}, function(pass, index){
        var remark = $(".layui-layer-input").val()
        console.log("remark",remark)
        console.log("name1",name)
        $.ajax({
            url:"/remark/save.html",
            type:"post",
            data:{name:name,remark:remark},
            success:function(res){
                //ul删除指定下标li
                var luckuserList = document.getElementById('luckuser—list');
                luckuserList.removeChild(luckuserList.childNodes[liIndex]);
                layer.msg('已经成功取消该评委！');
                layer.close(index)
            },
            error:function(err){
                console.log(err)
            }
        })

    })
}