/**
 * Created by Administrator on 2017/8/23.
 */
function page(l,url){
    $(".firstPage").unbind("click")
    $(".lastPage").unbind("click")
    $(".pages").unbind("click")
    $(".prePage").unbind("click")
    $(".nextPage").unbind("click")
    $("li").remove(".d");
    $(".only").hide()
    if(l==0){
        $(".pages").hide()
    }else if(l == 1){
        $(".pages").show()
        $(".pages li").hide()
        $(".only").show()
        for(var i=0;i<l;i++){
            $(".nextPage").before( '<li class=" d page p'+parseInt(i+1)+'">'+parseInt(i+1)+'</li>')
        }
    } else if(l<6 && l>1){
        $(".pages").show()
        for(var i=0;i<l;i++){
            $(".nextPage").before( '<li class=" d page p'+parseInt(i+1)+'">'+parseInt(i+1)+'</li>')
        }
    }else{
        $(".pages").show()
        for(var i=0;i<l;i++){
            if(i>2 && i<parseInt(l-1)){
                $(".nextPage").before( '<li class="d page p'+parseInt(i+1)+' h">'+parseInt(i+1)+'</li>')
            }else{
                $(".nextPage").before( '<li class="d page p'+parseInt(i+1)+'">'+parseInt(i+1)+'</li>')
            }
        }
        $(".p"+parseInt(l)).before( '<li class="page s'+l+'">...</li>')
        $(".h").addClass("hh");
    }
    var p1=1; //初始定义p1=1
    $(".prePage").css({"display":"none"});
    $(".p1").addClass("i");
    $(".firstPage").on("click",function(){
        var status = $(".select").val()
        var compan = $(".compan").val()
        console.log("3333333333333333333",status)
        $(".pages").show()

        if(l == 1){
            $(".nextPage").hide();
            $(".prePage").hide();
        }else{
            $(".nextPage").show()
            $(".prePage").hide()
        }

        p1 = 1;
        $(".p1").addClass("i").siblings().removeClass("i");
        $.ajax({
            url:url,
            type:"post",
            data:{s:p1,status:status,compan:compan},
            success:function(data,status){
                if(status == "success"){
                    console.log(data);
                    $("#render").html(template("tpl",{data:data}))
                }
            },
            error:function(err){
                console.log("page"+err)
            }
        })
        return false
    });
    $(".lastPage").on("click",function(){
        var status = $(".select").val()
        var compan = $(".compan").val()
        console.log("3333333333333333333",status)
        $(".pages").show()

        p1 = l;
        if(l == 1){
            $(".nextPage").hide();
            $(".prePage").hide();
        }else{
            $(".nextPage").hide();
            $(".prePage").show();
        }
        $(".p"+p1).addClass("i").siblings().removeClass("i")
        $.ajax({
            url:url,
            type:"post",
            data:{s:p1,status:status,compan:compan},
            success:function(data,status){
                if(status == "success"){
                    console.log(data);
                    $("#render").html(template("tpl",{data:data}))
                }
            },
            error:function(err){
                console.log("page"+err)
            }
        })
        return false
    });
    $(".pages").delegate(".d","click",function(){
        var status = $(".select").val()
        var compan = $(".compan").val()
        console.log("3333333333333333333",status)

        $(this).addClass("i").siblings().removeClass("i");
        p1=parseInt($(this).text());
        if(p1 == l && l == 1){
            $(".nextPage").hide()
            $(".prePage").hide()
        }else if(p1 == l && l != 1){
            $(".nextPage").hide()
            $(".prePage").show()
        }else if(p1 == 1 && l != 1){
            $(".prePage").hide()
            $(".nextPage").show()
        }else if(p1 == 1 && l == 1){
            $(".prePage").hide()
            $(".nextPage").hide()
        }else {
            $(".nextPage").show()
            $(".prePage").show()
        }
            $.ajax({
                url:url,
                type:"post",
                data:{s:p1,status:status,compan:compan},
                success:function(data,status){
                    if(status == "success"){
                        console.log(data);
                        $("#render").html(template("tpl",{data:data}))
                    }
                },
                error:function(err){
                    console.log("page"+err)
                }
            })
        return false
    }).css({"margin-left":"36%"});
    /* $(".prePage").css({"display":"none"});*/
    $(".prePage").on("click",function(){
        var status = $(".select").val()
        var compan = $(".compan").val()
        console.log("3333333333333333333",status)

        p1 -= 1;
        if(p1 == 1){
            $(".prePage").hide()
            $(".nextPage").show()
        }else{
            $(".nextPage").show()
            $(".prePage").show()
        }
        $.ajax({
            url:url,
            type:"post",
            data:{s:p1,status:status,compan:compan},
            success:function(data,status){
                if(status == "success"){
                    console.log(data);
                    $("#render").html(template("tpl",{data:data}))
                }
            },
            error:function(err){
                console.log("page"+err)
            }
        });
        if(p1 < 1){
            return p1=1;
        }else if($(".p"+p1).prev().hasClass("hh") && p1>3){
            $("li").remove(".s"+parseInt(p1+1));
            $(".p"+p1).before( '<li class="page s'+p1+'">...</li>');
        }else {
            $("li").remove(".s"+parseInt(p1+1))
        }
        $(".p"+p1).addClass("i").removeClass("hh").siblings().removeClass("i");
        return false
    });
    $(".nextPage").on("click",function(){
        var status = $(".select").val()
        var compan = $(".compan").val()
        console.log("3333333333333333333",status)
        console.log("33333333333333333332",compan)
        p1 += 1;
        if(p1 == l){
            $(".nextPage").hide();
            $(".prePage").show()
        }else{
            $(".nextPage").show();
            $(".prePage").show()
        }
        $.ajax({
            url:url,
            type:"post",
            data:{s:p1,status:status,compan:compan},
            success:function(data,status){
                if(status == "success"){
                    console.log(data);
                    $("#render").html(template("tpl",{data:data}))
                }
            },
            error:function(err){
                console.log("page"+err)
            }
        })
        if(p1 == l){
            $(".nextPage").css({"display":"none"})
            $(".p" + p1).removeClass("hh").addClass("i").siblings().removeClass("i");
        }else if(p1 <= 3){
            $(".p"+p1).addClass("i").siblings().removeClass("i");
        }else if(p1 > 3 ) {
            $(".p" + p1).removeClass("hh").addClass("i").siblings().removeClass("i");
        }
        return false
    });
}