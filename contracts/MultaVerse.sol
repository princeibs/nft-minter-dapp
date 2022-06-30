// SPDX-License-Identifier: MIT

pragma solidity >=0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

contract MultaVerse is ERC721URIStorage, Ownable, IERC721Receiver {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;
    Counters.Counter public _marketTokensCount;
    Counters.Counter public _marketTokensSold;
    Counters.Counter public _coinsOnSale;

    uint256 coinSupply;
    uint256 coinsAvailable;

    mapping(uint256 => MarketToken) public marketTokens;
    mapping(uint256 => TradeCoin) public coinsOnSale;

    // amount of coins put on sale by wallet
    mapping(address => uint256) public unavailableCoins;
    mapping(address => uint256) private coinsBalance;
    // keeps track of elements in coinsOnSale that have been bought/cancelled
    mapping(uint256 => bool) public soldCoins;
    mapping(address => uint256) private usersPurchaseCount;

    // keeps tracks of NFTs owned by wallet
    mapping(address => uint256[]) private walletOwnedTokens;

    modifier isOwner(uint256 tokenId) {
        require(
            msg.sender == ownerOf(tokenId),
            "Only the owner of the NFT is allowed to perform this action"
        );
        _;
    }

    event TokenMinted(address indexed creator, uint256 tokenId);
    event BuyToken(uint256 tokenId);
    event ClaimContractFunds();
    event MarketTokenCreated(
        uint256 tokenId,
        uint256 value,
        address payable owner,
        address payable seller,
        bool claimed
    );

    struct MarketToken {
        uint256 tokenId;
        uint256 value;
        address payable owner;
        address payable seller;
        bool claimed;
    }

    struct TradeCoin {
        address trader;
        uint256 amount;
    }

    constructor() ERC721("MultaVerse", "MTV") {
        coinsBalance[msg.sender] = 100; // credit owner with 100 coins
        coinSupply = 10000;
    }

    // create a MarketToken
    function createMarketToken(uint256 tokenId, uint256 tokenValue) private {
        require(tokenValue > 0, "token value too low");
        marketTokens[tokenId] = MarketToken(
            tokenId,
            tokenValue,
            payable(address(this)),
            payable(msg.sender),
            false
        );

        emit MarketTokenCreated(
            tokenId,
            tokenValue,
            payable(address(this)),
            payable(msg.sender),
            false
        );
    }

    // put up token for sale
    function sendTokenToMarket(uint256 tokenId, uint256 tokenValue)
        public
        isOwner(tokenId)
    {
        createMarketToken(tokenId, tokenValue);
        _marketTokensCount.increment();
        safeTransferFrom(msg.sender, address(this), tokenId);
    }

    // mint a new token
    function mintToken(string calldata tokenURI, uint256 tokenValue)
        public
        onlyOwner
    {
        require(tokenValue > 0, "token value too low");
        require(bytes(tokenURI).length > 7, "Invalid tokenURI");
        uint256 newTokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        walletOwnedTokens[msg.sender].push(newTokenId);
        _safeMint(msg.sender, newTokenId);
        _setTokenURI(newTokenId, tokenURI);

        sendTokenToMarket(newTokenId, tokenValue);
        emit TokenMinted(msg.sender, newTokenId);
    }

    function verifyPurchaseCount() private {
        require(coinsAvailable >= 100, "No more coins available to claim");
        // reward buyer with 100 points for every 5 purchase
        uint256 purchaseCount = usersPurchaseCount[msg.sender];
        if ((purchaseCount > 0) && (purchaseCount % 5 == 0)) {
            coinsBalance[msg.sender] += 100;
            coinsAvailable -= 100;
        }
    }

    // function to remove tokens sold by owner from walletOwnedTokens
    function removeOwnedToken(uint256 tokenId, address user) private {
        uint256 ownedCount = walletOwnedTokens[user].length;
        walletOwnedTokens[user][tokenId] = walletOwnedTokens[user][
            ownedCount - 1
        ];
        walletOwnedTokens[user].pop();
    }

    // allows user to put their coins on sale
    function tradeCoins(uint256 _amount) public {
        require(_amount > 0, "Invalid amount");
        require(
            coinsBalance[msg.sender] >= _amount,
            "Not enough coins to sell"
        );
        coinsOnSale[_coinsOnSale.current()] = TradeCoin(msg.sender, _amount);
        unavailableCoins[msg.sender] += _amount;
        coinsBalance[msg.sender] -= _amount;
    }

    // allow user to cancel an instance of TradeCoin and retrieve back their coins
    function unTradeCoins(uint256 _tradeCoinId) public {
        require(!soldCoins[_tradeCoinId], "Query of non existent coins sale");
        require(
            _tradeCoinId < _coinsOnSale.current(),
            "Query of invalid TraderCoin"
        );
        require(
            coinsOnSale[_tradeCoinId].trader == msg.sender,
            "Not coins owner"
        );
        uint256 amount = coinsOnSale[_tradeCoinId].amount;
        coinsOnSale[_tradeCoinId].amount = 0;
        unavailableCoins[msg.sender] -= amount;
        coinsBalance[msg.sender] += amount;

        coinsOnSale[_tradeCoinId].trader = address(0);
        soldCoins[_tradeCoinId] = true;
    }

    // allows user to buy coins from other users
    function buyCoins(uint256 _tradeCoinId) public payable {
        require(!soldCoins[_tradeCoinId], "Query of non existent coins sale");
        require(
            msg.value == (coinsOnSale[_tradeCoinId].amount * 0.01 ether),
            "Insufficient funds"
        );
        address payable seller = payable(coinsOnSale[_tradeCoinId].trader);
        require(
            seller != msg.sender,
            "Untrade your coins if you want them back"
        );
        uint256 amount = coinsOnSale[_tradeCoinId].amount;
        coinsOnSale[_tradeCoinId].amount = 0;
        coinsBalance[msg.sender] += amount;
        unavailableCoins[seller] -= amount;
        coinsOnSale[_tradeCoinId].trader = address(0);

        (bool sent, ) = seller.call{value: msg.value}("");
        require(sent, "Transfer failed");
    }

    // buy token with ether
    function buyTokenWithFund(uint256 tokenId) public payable {
        uint256 cost = marketTokens[tokenId].value;
        require(
            msg.sender != marketTokens[tokenId].seller,
            "seller cannot buy own token"
        );
        require(
            msg.value == cost * (1 ether / 100),
            "funds not enough for purchase"
        );
        // 1 coin == 1/100 ether

        buyToken(tokenId, msg.sender);
        usersPurchaseCount[msg.sender]++;

        /// TODO: transfer `msg.value` to the token seller after successful purchase
        verifyPurchaseCount();
    }

    // buy token with funds
    function buyTokenWithCoins(uint256 tokenId) public {
        require(
            msg.sender != marketTokens[tokenId].seller,
            "seller cannot buy own token"
        );
        require(
            coinsBalance[msg.sender] >= marketTokens[tokenId].value,
            "insufficient coins"
        );

        coinsBalance[msg.sender] -= marketTokens[tokenId].value;
        coinsBalance[marketTokens[tokenId].seller] += marketTokens[tokenId]
            .value;
        buyToken(tokenId, msg.sender);
        usersPurchaseCount[msg.sender]++;

        verifyPurchaseCount();
    }

    // buy token from market
    function buyToken(uint256 tokenId, address newOwner) private {
        removeOwnedToken(tokenId, marketTokens[tokenId].seller);
        marketTokens[tokenId].claimed = true;
        marketTokens[tokenId].owner = payable(newOwner);
        marketTokens[tokenId].seller = payable(address(0));

        walletOwnedTokens[marketTokens[tokenId].seller].push(tokenId);
        _marketTokensSold.increment();
        _transfer(address(this), newOwner, tokenId);

        emit BuyToken(tokenId);
    }

    // get all tokens user owns
    function getMyTokens() public view returns (uint256[] memory) {
        return walletOwnedTokens[msg.sender];
    }

    // return if `tokenId` is not in market
    function tokenInMarket(uint256 tokenId) public view returns (bool) {
        require(_exists(tokenId), "Operator query for nonexistent token");
        return !marketTokens[tokenId].claimed;
    }

    // get all tokens available for sale in market
    function getAllMarketTokens() public view returns (MarketToken[] memory) {
        uint256 unclaimedTokensCount = _marketTokensCount.current() -
            _marketTokensSold.current();
        uint256 index = 0;

        MarketToken[] memory allMarketTokens = new MarketToken[](
            unclaimedTokensCount
        );
        for (uint256 i = 0; i < _tokenIdCounter.current(); ) {
            if (tokenInMarket(i)) {
                allMarketTokens[index] = marketTokens[i];
                index++;
            }
            ++i;
        }
        return allMarketTokens;
    }

    // get user's points balance
    function getCoinsBalance() public view returns (uint256) {
        return coinsBalance[msg.sender];
    }

    // get total purchase count
    function getPurchaseCount() public view returns (uint256) {
        return usersPurchaseCount[msg.sender];
    }

    // check contract balance
    function contractBalance() public view onlyOwner returns (uint256) {
        return address(this).balance;
    }

    // claim contract funds
    function claimContractFunds() public payable onlyOwner {
        (bool sent, ) = payable(msg.sender).call{value: contractBalance()}("");
        require(sent, "Funds withdrawal from contract balance failed");
        emit ClaimContractFunds();
    }

    // return count of total tokens minted
    function getTokensLength() public view returns (uint256) {
        return _tokenIdCounter.current();
    }

    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return bytes4(this.onERC721Received.selector);
    }

    receive() external payable {}
}
