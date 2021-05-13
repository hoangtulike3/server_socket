var express = require("express");
var app = express();
app.use(express.static("public"));
app.set("view engine", "ejs");
app.set("views", "./views");
var server = require("http").createServer(app);
var io = require("socket.io")(server);
server.listen(process.env.PORT || 3000);

var users=[];

const {  Client } = require('pg')

const client = new Client({
    user: 'ccg',
    host: 'ccg.cexrfznwa2iv.ap-northeast-2.rds.amazonaws.com',
    database: 'thingtalk',
    password: 'ccgadmin1!',
    port: 5432,
  })
  client.connect();
    
//ADD DATA TO DB OF CHAT
async function insert_data(name, room, chat){
    const time_now = await client.query("SELECT current_time");
    const date_now = await client.query("SELECT current_date");
    //console.log(date_now.rows[0].current_date);
    const text = "INSERT INTO thingtalk(time, date, name, room, chat) VALUES($1, $2, $3, $4, $5) RETURNING *";
    const values = [time_now.rows[0].current_time, date_now.rows[0].current_date, name, room, chat];
    // callback
    client.query(text, values, (err, res) => {
        if (err) {
        console.log(err.stack)
        } else {
        //console.log("Insert_chat")
        }
    })
};

//DELETE CHAT
async function delete_chat(name, room){
    const time_now = await client.query("SELECT current_time");
    const date_now = await client.query("SELECT current_date");
    const text = "INSERT INTO delete_chattext(name, room, time, date) VALUES($1, $2, $3, $4) RETURNING *";
    const values = [name, room, time_now.rows[0].current_time, date_now.rows[0].current_date];
    // callback
    client.query(text, values, (err, res) => {
        if (err) {
        console.log(err.stack)
        } else {
        //console.log("inset_deletechat")
        }
    })
}

io.on('connection', (socket) => {
    // console.log("Connected");
    socket.on('signin', async (name, room) => {
        if(users.indexOf(name)>=0){
            socket.emit("signin_fail");
        }
        else{
            users.push(name);
            socket.name = name;
            socket.room = room;
            socket.broadcast.in(socket.room).emit("message_connected", name);
            socket.emit("signin_success");
            io.sockets.emit('list_user', users);
            socket.join(room);
            //GET DATA OLD
            try //GET NEW CHAT MESSAGE AFTER CLICK DELETE
            {
                const time_deleted = await client.query("SELECT time FROM delete_chattext WHERE room = '"+ socket.room +"' AND name = '"+ socket.name +"'");
                const date_deleted = await client.query("SELECT TO_CHAR(date :: DATE, 'yyyy-mm-dd') from delete_chattext WHERE room = '"+ socket.room +"' AND name = '"+ socket.name +"'");
                const result = await client.query("SELECT * FROM thingtalk WHERE time >= '"+ time_deleted.rows[time_deleted.rows.length-1].time +"' AND date >= '"+ date_deleted.rows[date_deleted.rows.length-1].to_char +"'");
                socket.emit("old_message", result.rows, socket.name);
                // console.log("log new data after delete");
        }
            catch(error) //GET ALL CHAT MESSAGE WITH USER NOT HAVE DELETE INFO
            {
                const result = await client.query("SELECT * FROM thingtalk WHERE room = '"+ socket.room +"'");
                socket.emit("old_message", result.rows, socket.name);
                // console.log("log old data all");
            }
        };
    });
    
    socket.on('disconnect', () => {
        if(users.indexOf(socket.name)>=0){
            users.splice(users.indexOf(socket.name), 1);
            socket.broadcast.in(socket.room).emit("message_disconnected", socket.name);
            io.sockets.emit('list_user', users);
        };
    });

    socket.on('delete_chat', () =>{
        delete_chat(socket.name, socket.room);
    });

    socket.on('data_send', async (data) =>{
        console.log("Receipt data: "+ data);
        data = data.split("/");
        console.log(data);
        const time_now = await client.query("SELECT current_time");
        const date_now = await client.query("SELECT current_date");
        // io.sockets.in("123").emit("chat_message", time_now.rows[0].current_time, "HAHAHA", data);
        // insert_data("HAHAHA", "123", data);
        //console.log(date_now.rows[0].current_date);
        const text = "INSERT INTO sensor_data(id, time, data1, data2, data3, data4) VALUES($1, $2, $3, $4, $5, $6) RETURNING *";
        const values = [data[0] ,time_now.rows[0].current_time, data[1], data[2], data[3], data[4]];
        // callback
        client.query(text, values, (err, res) => {
            if (err) {
            console.log(err.stack)
            } else {
            // console.log("Insert_datasensor")
            }
        })
    });

    socket.on('chat_message', async (data) => {
        const time_now = await client.query("SELECT current_time");
        io.sockets.in(socket.room).emit("chat_message", time_now.rows[0].current_time, socket.name, data);
        insert_data(socket.name, socket.room, data);
        // GET DATA OF SENSOR
        if(data == "GET DATA")
        {
            const senor_data = await client.query("SELECT * FROM sensor_data");
            const sensor_dt = "Data 1: " + senor_data.rows[senor_data.rows.length-1].data1 + " || Data 2: " + senor_data.rows[senor_data.rows.length-1].data2 + " || Data 3: " + senor_data.rows[senor_data.rows.length-1].data3 + " || Data 4: " + senor_data.rows[senor_data.rows.length-1].data4;
            io.sockets.in(socket.room).emit("chat_message", time_now.rows[0].current_time, "THING RESPONSE", sensor_dt);
            insert_data("THING RESPONSE", socket.room, sensor_dt);
        }
    });
});

app.get("/", function(req, res){
    res.render("home");
});