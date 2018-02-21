var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');

function isEmptyObject(obj) {
    return !(obj && obj !== 'null' && obj !== 'undefined');
}

var dict = {};

// Đăng ký các sự kiện của socket
io.on('connection', function (socket) {
    socket.on('setUsername', function (idFb) {
        socket.username = idFb;
    });

    socket.on('chatMessage', function (msg) {
        if (!isEmptyObject(socket.password) && socket.password.length > 0) {
            if (!isEmptyObject(socket.username) && socket.username.length > 0) {
                io.to(socket.password).emit('chatMessage', JSON.stringify({ 'idFb': socket.username, 'msg': msg }));
            }
        }
    });

    socket.on('taoPhong', function (idPhong, kieu, xoay, viTri, maxNumber) {
        if (!isEmptyObject(socket.username) && socket.username.length > 0) {
            if (!isEmptyObject(dict[idPhong])) {
                socket.emit('daTaoPhong', -1);
            } else {
                dict[idPhong] = { 'idPhong': idPhong, 'truongPhong': '', 'kieu': kieu, 'xoay': xoay, 'viTri': viTri, 'maxNumber': maxNumber, 'dangChoi': 0, 'nguoiChoi': {}, 'biChan': {} };
                socket.emit('daTaoPhong', 1);
                console.log(dict[idPhong]);
            }
        }
    });

    socket.on('vaoPhong', function (idPhong, anhFb, tenFb) {
        if (!isEmptyObject(socket.username) && socket.username.length > 0) {
            if (isEmptyObject(dict[idPhong])) {
                socket.emit('loiVaoPhong', 1);
            } else {
                var phong = dict[idPhong];
                if (phong['dangChoi'] > 0) {
                    socket.emit('loiVaoPhong', 2);
                } else if (Object.keys(phong['nguoiChoi']).length >= 20) {
                    socket.emit('loiVaoPhong', 3);
                } else if(!isEmptyObject(phong['biChan'][socket.username])){
                    socket.emit('loiVaoPhong', 4);
                }else if(!isEmptyObject(phong['nguoiChoi'][socket.username])){
                    socket.emit('loiVaoPhong', 5);
                }else{
                    if(phong['truongPhong'].length === 0){
                        phong['truongPhong']=socket.username;
                    }
                    phong['nguoiChoi'][socket.username] = { 'anhFb': anhFb, 'tenFb': tenFb, 'sanSang': 0, 'timDuoc': 0 };
                    socket.emit('daVaoPhong', JSON.stringify(phong));
                    socket.password = idPhong;
                    io.to(idPhong).emit('coNguoiVaoPhong', JSON.stringify({ 'idFb': socket.username, 'anhFb': anhFb, 'tenFb': tenFb }));
                    socket.join(idPhong);
                }
            }
        }
    });

     socket.on('vaoLaiPhong', function () {
        if (!isEmptyObject(socket.password) && socket.password.length > 0) {
        if (!isEmptyObject(socket.username) && socket.username.length > 0) {
            var idPhong = socket.password;
            if (isEmptyObject(dict[idPhong])) {
                socket.emit('loiVaoPhong', 1);
            } else {
                var phong = dict[idPhong];
                if (phong['dangChoi'] > 0) {
                    socket.emit('loiVaoPhong', 2);
                } else if (Object.keys(phong['nguoiChoi']).length >= 20) {
                    socket.emit('loiVaoPhong', 3);
                } else if(!isEmptyObject(phong['biChan'][socket.username])){
                    socket.emit('loiVaoPhong', 4);
                }else{
                    if(phong['truongPhong'].length === 0){
                        phong['truongPhong']=socket.username;
                    }
                    socket.emit('daVaoPhong', JSON.stringify(phong));
                }
            }
        }
        }
    });

    socket.on('thoatPhong', function (idFb) {
        if (!isEmptyObject(socket.password) && socket.password.length > 0) {
            if (!isEmptyObject(socket.username) && socket.username.length > 0) {
                var clients = io.sockets.adapter.rooms[socket.password];
                if(!isEmptyObject(clients)){
                    var ids = Object.keys(clients.sockets);
                    for(var i=0;i<ids.length;i++){
                        var client = io.sockets.connected[ids[i]];
                        if(client.username === idFb){
                            client.leave(socket.password);
                            var phong = dict[socket.password];
                            if(!(socket.username === client.username)){
                                client.emit('daThoatPhong',2);
                                phong['biChan'][client.username]=1;
                            }
                            if(!isEmptyObject(phong['nguoiChoi'][idFb])){
                                delete phong['nguoiChoi'][idFb];
                            }
                            if (Object.keys(phong['nguoiChoi']).length === 0) {
                                delete dict[socket.password];
                            } else {
                                if (idFb == phong['truongPhong']) {
                                    phong['truongPhong'] = Object.keys(phong['nguoiChoi'])[0];
                                }   
                                io.to(socket.password).emit('coNguoiThoatPhong',JSON.stringify({'idFb':idFb, 'truongPhong':phong['truongPhong']}));
                            }
                            client.password = '';
                        }
                    }
                }
            }
        }
    });

    socket.on('sanSang', function () {
        if (!isEmptyObject(socket.password) && socket.password.length > 0) {
            if (!isEmptyObject(socket.username) && socket.username.length > 0) {
                if (isEmptyObject(dict[socket.password])) {
                    socket.emit('daSanSang', '0');
                } else {
                    dict[socket.password]['nguoiChoi'][socket.username]['sanSang'] = 1;
                    io.to(socket.password).emit('daSanSang', socket.username);
                }
            }
        }
    });

    socket.on('batDauChoi', function () {
        if (!isEmptyObject(socket.password) && socket.password.length > 0) {
            if (isEmptyObject(dict[socket.password])) {
                socket.emit('daBatDau', 0);
            } else {
                var phong = dict[socket.password];
                phong['dangChoi'] = 1;
                io.to(socket.password).emit('daBatDau', 1);
            }
        }
    });

    socket.on('timDuocSo', function (so) {
        if (!isEmptyObject(socket.password) && socket.password.length > 0) {
            if (!isEmptyObject(socket.username) && socket.username.length > 0) {
                if (isEmptyObject(dict[socket.password])) {
                    socket.emit('loiTimSo', 0);
                } else {
                    var phong = dict[socket.password];
                    if (phong['dangChoi'] === so) {
                        phong['dangChoi'] = phong['dangChoi'] + 1;
                        phong['nguoiChoi'][socket.username]['timDuoc'] = phong['nguoiChoi'][socket.username]['timDuoc'] + 1;
                        var diem = {};
                        var nc = Object.keys(phong['nguoiChoi']);
                        for(var i=0;i<nc.length;i++){
                            diem[nc[i]]=phong['nguoiChoi'][nc[i]]['timDuoc'];
                        }
                        io.to(socket.password).emit('daTimDuoc', JSON.stringify({ 'idFb': socket.username, 'diem': diem, 'dangChoi': phong['dangChoi'] }));
                        if(phong['dangChoi']>phong['maxNumber']){
                            phong['biChan']={};
                            for(var i = 0; i < nc.length; i++){
                                phong['nguoiChoi'][nc[i]]['sanSang']=0;
                                phong['nguoiChoi'][nc[i]]['timDuoc']=0;
                            }
                            phong['dangChoi'] = 0;
                            phong['truongPhong']='';
                        }
                    } else {
                        socket.emit('loiTimSo', phong['dangChoi']);
                    }
                }
            }
        }
    });

    socket.on('disconnect', function () {
        if (!isEmptyObject(socket.password) && socket.password.length > 0) {
            if (!isEmptyObject(socket.username) && socket.username.length > 0) {
                var phong = dict[socket.password];
                if(!isEmptyObject(phong['nguoiChoi'][socket.username])){
                    delete phong['nguoiChoi'][socket.username];
                }
                if (Object.keys(phong['nguoiChoi']).length === 0) {
                    delete dict[socket.password];
                } else {
                    if (socket.username == phong['truongPhong']) {
                        phong['truongPhong'] = Object.keys(phong['nguoiChoi'])[0];
                    }
                    io.to(socket.password).emit('coNguoiThoatPhong',JSON.stringify({'idFb':socket.username, 'truongPhong':phong['truongPhong']}));
                }
            }
        }
    });

});

// Mở cổng lắng nghe của socket là 3000
http.listen(3000, function () {
    console.log('listening on *:3000');
});