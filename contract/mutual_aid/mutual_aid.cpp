#include <mutual_aid.hpp>
#include <eosiolib/print.hpp>

using namespace eosio;

void mutaid::join(const account_name renter, const std::string address, const std::string content, const asset& quantity)
{
	eosio_assert(quantity.is_valid(), "invalid quantity");
    eosio_assert(quantity.symbol.precision() == 4, "the asset precision of EOS must be 4, like 1.0000 EOS");
    eosio_assert(quantity == asset(10000,S(4,EOS)), "deposit 1.0000 EOS to join the contract");

    auto itr = participators.find(renter);
    eosio_assert(itr == participators.end(), "the renter aready joined the contract.");

    action(
        permission_level{renter, N(active)},
        N(validator), N(add),
        std::make_tuple(renter, address, content)
    ).send();

    action(
        permission_level{renter, N(active)},
        N(eosio.token), N(transfer), 
        std::make_tuple(renter, _self, quantity, std::string(""))
    ).send();

    auto eosrisk_num = quantity.amount/10000*risk_rate;
    itr = participators.emplace(_self, [&](auto& participator){
        participator.owner = renter;
        participator.rate = risk_rate;
        participator.risk_balance = asset(eosrisk_num, S(0,RNT));
        participator.expiration = now() + contract_ttl;
        participator.address = address;
        participator.content = content;
    });
    
    print("Congratulations,", name{renter}, "! you join the contract success.");
}

void mutaid::make(const account_name asker, const uint64_t number, const asset& price)
{
    eosio_assert(price.is_valid(), "invalid price");
    eosio_assert(price.symbol.precision() == 4, "the asset precision of EOS must be 4, like 1.0000 EOS");
    eosio_assert(price.amount > 0, "the price must be positive");

    if (has_auth(asker))
    {
        auto itr = participators.find(asker);
        eosio_assert(itr != participators.end(), "the user not exist!");
        eosio_assert(itr->risk_balance >= asset(number, S(0,RNT)), "the balance is not enough");
        
        participators.modify(itr, _self, [&](auto& participator){
            participator.sell_num = number;
            participator.ask = price;
        });
    }
    else
        eosio_assert(false, "insufficient authority!");

    print("set success!");
}

void mutaid::take(const account_name taker, const account_name from, const uint64_t number){
    eosio_assert(number > 0, "the number must be positive");

    eosio_assert(has_auth(taker), "insufficient authority!");
   
    auto itr = participators.find(from);
    eosio_assert(itr != participators.end(), "the risk asset not exist!");
    eosio_assert(itr->sell_num >= number, "the balance for sell is not enough");

    if (itr->expiration < now())
    {
        participators.erase(itr);
        print("the risk token is expiration");
        return;
    }

    auto tmp = asset(itr->ask.amount*number, S(4,EOS));

    action(
        permission_level{taker, N(active)},
        N(eosio.token), N(transfer), 
        std::make_tuple(taker, from, tmp, std::string(""))
    ).send();

    auto itr1 = participators.find(taker);
    if (itr1 != participators.end()){
        participators.modify(itr1, _self, [&](auto& participator){
            participator.risk_balance.amount += number;
        });
    }
    else{
        participators.emplace(_self, [&](auto& participator){
            participator.owner = taker;
            participator.rate = itr->rate;
            participator.risk_balance = asset(number, S(0,RNT));
            participator.expiration = itr->expiration;
            participator.address = itr->address;
            participator.content = itr->content;
        });
    }

    if(itr->risk_balance == asset(number, S(0,RNT)))
        participators.erase(itr);
    else{
        participators.modify(itr, _self, [&](auto& participator){
            participator.sell_num -= number;
            participator.risk_balance -= asset(number, S(0,RNT));
        });
    }

    print("set success!");
}        

void mutaid::transfer(const account_name from, const account_name to, const uint64_t number){
    eosio_assert(has_auth(from), "insufficient authority!");
    
    auto itr = participators.find(from);
    eosio_assert(itr != participators.end(), "the user not exist!");
    eosio_assert(itr->risk_balance.amount >= number, "the balance is not enough");

    auto itr1 = participators.find(to);
    if (itr1 != participators.end()){
        participators.modify(itr1, _self, [&](auto& participator){
            participator.risk_balance.amount += number;
        });
    }
    else{
        participators.emplace(_self, [&](auto& participator){
            participator.owner = to;
            participator.rate = itr->rate;
            participator.risk_balance = asset(number, S(0,RNT));
            participator.expiration = itr->expiration;
            participator.address = itr->address;
            participator.content = itr->content;
        });
    }
    
    participators.modify(itr, _self, [&](auto& participator){
        if((itr->risk_balance.amount - number) < itr->sell_num)
            participator.sell_num = itr->risk_balance.amount - number;
        participator.risk_balance -= asset(number, S(0,RNT));
    });
}

void mutaid::apply(const account_name applicants, const std::string address, const std::string content){
    eosio_assert(has_auth(applicants), "insufficient authority!");

    action(
        permission_level{applicants, N(active)},
        N(validator), N(apply),
        std::make_tuple(applicants, address, content)
    ).send();
}

void mutaid::claim(const account_name owner){
    eosio_assert(has_auth(owner), "insufficient authority!");

    auto itr = participators.find(owner);
    eosio_assert(itr != participators.end(), "the user not exist!");

    if (itr->expiration < now())
    {   
        auto deleted_participator1 = participators.erase(itr);
        print("the risk token is expiration");
        return;
    }

    auto from_time = itr->expiration - contract_ttl;
    action(
        permission_level{_self, N(active)},
        N(validator), N(check),
        std::make_tuple(from_time, itr->expiration, itr->address, itr->content)
    ).send();

    auto tmp = asset(itr->risk_balance.amount*10000, S(4,EOS));
    action(
        permission_level{_self, N(active)},
        N(eosio.token), N(transfer),
        std::make_tuple(_self, owner, tmp, std::string(""))
    ).send();

    participators.erase(itr);

    print("Congratulations!", name{owner}, "! your claim is accepted.");
}

