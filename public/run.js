var socket = io("https://thingtalk.herokuapp.com");

socket.on('signin_fail', function(data){
    alert("This name is used by other people");
});

socket.on('message_connected', function(data){
    $("#chat_message_list").append("New person '"+ data +"' has been joined in this room."+ "<br>");
    $("#chat_message_list").scrollTop($("#chat_message_list").height());
});

socket.on('signin_success', function(data){
    $("#signin_container").hide();
    $("#chat_container").show(1000);
});

socket.on('list_user', function(data){
    $("#coversation_list").html("");
    data.forEach(function(i){
        //console.log(i);
        var conversation_list_html = '';
        $("#coversation_list").append('<div class="conversation"> <img src="icon/no_avatar.jpg" alt="Nguyen Mau Hoang"/> <div class="title_text">' + i + '</div> <div class="created_date">Apr 16</div> <div class="conversation_message">This is a new message asdfewfifgvhoailjsdhbfligasjbdflijabsnflkajsdbflkajsdbflaskjdbflasdkjfbsadf</div></div>');
    });
});

socket.on('message_disconnected', function(data){
    $("#chat_message_list").append("Person '"+ data +"' has been left this room."+ "<br>");
    $("#chat_message_list").scrollTop($("#chat_message_list").height());
});

socket.on('old_message', function(data, name){
    //  console.log(data);
    //  console.log(name);
    for(i=0; i<data.length; i++)
    {
        if(data[i].name == name)
        {
            // $("#messages").append("<b>" + data[i].name + ": " + "</b>" +"["+ data[i].time +"]"+ "<br>" + data[i].chat + "<br>");
            $("#chat_message_list").append('<div class="message_row you_message"> <div class="message_content"> <div class="message_text">' + data[i].chat + '</div> <div class="message_time">' + data[i].time + '</div> </div> </div>');
            $("#chat_message_list").scrollTop($("#chat_message_list").height());
        }
        else
        {
            $("#chat_message_list").append('<div class="message_row other_message"> <div class="message_content"> <img src="icon/no_avatar.jpg" alt="User"/> <div class="message_text">' + data[i].chat + '</div> <div class="message_time">' + data[i].time + '</div> </div> </div>');
            $("#chat_message_list").scrollTop($("#chat_message_list").height());
        }
    }
});

socket.on('chat_message', function(time, user, data){
    // $("#messages").append("<b>" + user + ": " + "</b>" +"["+ time +"]"+ "<br>" + data + "<br>");
    // $("#messages").scrollTop($("#messages").height());
    if(user == $("#name").val())
    {
        // $("#messages").append("<b>" + data[i].name + ": " + "</b>" +"["+ data[i].time +"]"+ "<br>" + data[i].chat + "<br>");
        $("#chat_message_list").append('<div class="message_row you_message"> <div class="message_content"> <div class="message_text">' + data + '</div> <div class="message_time">' + time + '</div> </div> </div>');
        $("#chat_message_list").scrollTop($("#chat_message_list").height());
    }
    else
    {
        $("#chat_message_list").append('<div class="message_row other_message"> <div class="message_content"> <img src="icon/no_avatar.jpg" alt="User"/> <div class="message_text">' + data + '</div> <div class="message_time">' + time + '</div> </div> </div>');
        $("#chat_message_list").scrollTop($("#chat_message_list").height());
    }
});

$(document).ready(function(){
    $("#signin_container").show();
    $("#chat_container").hide();

    $("#bt_signin").click(function(){
        if($("#name").val() != "" && $("#room").val() != ""){
            socket.emit("signin", $("#name").val(), $("#room").val());
            $("#names").append('<span id="name_roomchat">' + $("#name").val() + '</span>')
            $("#name_roomchat").append("<div class= 'rooms'>" + $("#room").val() + "</div>");
        }
        else{
            alert("Name and Room cannot be empty!");
        }
    });

    $("#bt_delete").click(function(){
        socket.emit('delete_chat');
        $("#chat_message_list").html("");
    });

    // $("#bt_send").click(function(){
    //     if(input.value != ""){
    //         socket.emit('chat_message', input.value);
    //         $("input").val("");
    //     }
    // });
    $("#chat_only").keypress(function(event){
        var keycode = (event.keyCode ? event.keyCode : event.which);
        if(keycode == '13' && chat_only.value != ""){
            socket.emit('chat_message', chat_only.value);
            $("#chat_only").val(""); 
        };
    });
});
