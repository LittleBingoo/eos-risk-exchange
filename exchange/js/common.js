/**
 * Created by pengkunzhao on 2018/6/9.
 */
var loginUser = null;

$(function () {

    var userControlNav = $('.user-control-nav');

    var createAccountNav = $('.create-account-nav');

    var alice = 'alice'

    var alice_privatekey = '5K6uR32fPrvfiysgdJEt62U53txKVgQr31TvouwCcjBe6D2zbQC'

    // login user
    var user = JSON.parse(localStorage.getItem("user"));
    if(user){
        loginUser = user;
        userControlNav.children('.username-nav').html(loginUser.username);
        $('.publickey-nav').html(loginUser.publicKey);
        $('.privatekey-nav').html(loginUser.privateKey);
        userControlNav.removeClass('hide');
        
        //User Balance
        eos_balance(loginUser.username,function (result) {
            var balanceValue = '0.0000 EOS';
            if(result.status){
                var balance = result.message;
                if(balance.length > 0){
                    balanceValue = balance[0]
                }
            }
            $('.eos-balance-nav-value').html(balanceValue);
        })

    }else{
        createAccountNav.removeClass('hide');
    }


    // User Login

    $('.login-tab').on('click',function () {
        event.stopPropagation();
    })

    // new Clipboard('.copy-publickey-nav');
    // new Clipboard('.copy-privatekey-nav');

    // $('.copy-publickey-nav').on('click',function () {
    //     new Clipboard('. publickey-nav');
    // })

    // $('.copy-privatekey-nav').on('click',function () {
    //     new Clipboard('. privatekey-nav');
    // })

    $('.create-account-btn').on('click',function () {
        var account = $('#create-account').val();

        if(!account){
            alert('Please input your username');
        }

        eos_randomAccount(alice,account,alice_privatekey,function (result) {
            if(!result.status){
                alert('Internal Service Error');
                return false;
            }
            //reg
            var user = {
                username : result.message.name,
                publicKey : result.message.publicKey,
                privateKey : result.message.privateKey,
            }

            //save to local
            var userString = JSON.stringify(user);
            window.localStorage.setItem('user',userString);

            //reload page
            window.location.reload();
        });

    })

    $('.logout-nav').on('click',function () {
        localStorage.removeItem('user');
        //reload page
        window.location.reload();
    })

    $('.get-free-btn').on('click',function () {
        eos_transfer(alice,loginUser.username,'50.0000 EOS','getFree',alice_privatekey,function (result) {
            if(result.status){
                alert('Success');
                window.location.reload();
            }else{
                alert('Failed');
            }
        })
    })

    $('.join-rent').on('click',function () {
        var renter = loginUser.username;
        var rent_address = $('#input-join-rent').val();
        var rent_type = $('#getEosrisk-type').val();
        var renter_privatekey = loginUser.privateKey;
        house_rental_join(renter,rent_address,rent_type,renter_privatekey,function (result) {
            if(result.status){
                alert('Success');
                window.location.href="myRiskToken.html";
            }else{
                alert('Failed');
            }
        })
    });
})