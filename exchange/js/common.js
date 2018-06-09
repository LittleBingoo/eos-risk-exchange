/**
 * Created by pengkunzhao on 2018/6/9.
 */
var loginUser = null;

$(function () {

    var userControlNav = $('.user-control-nav');

    var createAccountNav = $('.create-account-nav');

    // login user
    var user = JSON.parse(localStorage.getItem("user"));
    if(user){
        loginUser = user;
        userControlNav.children('.username-nav').html(loginUser.username);
        $('.publickey-nav').html(loginUser.publicKey);
        $('.privatekey-nav').html(loginUser.privateKey);
        userControlNav.removeClass('hide');
    }else{
        createAccountNav.removeClass('hide');
    }


    // User Login

    $('.login-tab').on('click',function () {
        event.stopPropagation();
    })

    $('.copy-publickey-nav').on('click',function () {

    })

    $('.copy-privatekey-nav').on('click',function () {

    })

    $('.create-account-btn').on('click',function () {
        var account = $('#create-account').val();

        //reg
        var user = {
            username : account,
            publicKey : 'abc',
            privateKey : 'def',
        }

        //save to local
        var userString = JSON.stringify(user);
        window.localStorage.setItem('user',userString);

        //reload page
        window.location.reload();
    })

    $('.logout-nav').on('click',function () {
        localStorage.removeItem('user');
        //reload page
        window.location.reload();
    })
})