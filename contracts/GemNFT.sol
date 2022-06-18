// SPDX-License-Identifier: MIT

pragma solidity >=0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract GemNFT is ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;
    Counters.Counter public _marketTokensCount;
    Counters.Counter public _marketTokensSold;

    mapping(uint256 => MarketToken) private marketTokens;
    mapping(address => uint256) private coinsBalance;
    mapping(address => uint256) private usersPurchaseCount;

    modifier isOwner(uint256 tokenId) {
        require(msg.sender == ownerOf(tokenId));
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

    constructor() ERC721("Gem Collection", "GEM") {
        coinsBalance[msg.sender] = 100; // credit owner with 100 coins
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
        _transfer(msg.sender, address(this), tokenId);
    }

    // mint a new token
    function mintToken(string calldata tokenURI, uint256 tokenValue)
        public
        onlyOwner
    {
        require(tokenValue > 0, "token value too low");
        uint256 newTokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();

        _safeMint(msg.sender, newTokenId);
        _setTokenURI(newTokenId, tokenURI);

        sendTokenToMarket(newTokenId, tokenValue);
        emit TokenMinted(msg.sender, newTokenId);
    }

    // buy token with ether
    function buyTokenWithFund(uint256 tokenId) public payable {
        uint256 cost = marketTokens[tokenId].value;
        require(
            msg.sender != marketTokens[tokenId].seller,
            "seller cannot buy own token"
        );
        require(
            msg.value >= cost * (1 ether / 100),
            "funds not enough for purchase"
        );
        // 1 coin == 1/100 ether

        buyToken(tokenId, msg.sender);
        usersPurchaseCount[msg.sender]++;

        // reward buyer with 100 points for every 5 purchase
        uint256 purchaseCount = usersPurchaseCount[msg.sender];
        if ((purchaseCount > 0) && (purchaseCount % 5 == 0)) {
            coinsBalance[msg.sender] += 100;
        }
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
        buyToken(tokenId, msg.sender);
        usersPurchaseCount[msg.sender]++;

        // reward buyer with 100 points for every 5 purchase
        uint256 purchaseCount = usersPurchaseCount[msg.sender];
        if ((purchaseCount > 0) && (purchaseCount % 5 == 0)) {
            coinsBalance[msg.sender] += 100;
        }
    }

    // buy token from market
    function buyToken(uint256 tokenId, address newOwner) private {
        marketTokens[tokenId].claimed = true;
        marketTokens[tokenId].owner = payable(newOwner);
        marketTokens[tokenId].seller = payable(address(0));

        _marketTokensSold.increment();
        _transfer(address(this), newOwner, tokenId);

        emit BuyToken(tokenId);
    }

    // get all tokens user owns
    function getMyTokens() public view returns (uint256[] memory) {
        uint256 index;
        uint256 totalTokensCount = _tokenIdCounter.current();
        uint256[] memory myTokens = new uint256[](balanceOf(msg.sender));

        for (uint256 i = 0; i < totalTokensCount; ) {
            if (ownerOf(i) == msg.sender) {
                myTokens[index] = i;
                index++;
            }
            ++i;
        }
        return myTokens;
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
        for (uint256 i = 0; i < _marketTokensCount.current(); ) {
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
        payable(msg.sender).transfer(contractBalance());
        emit ClaimContractFunds();
    }

    // return count of total tokens minted
    function getTokensLength() public view returns (uint256) {
        return _tokenIdCounter.current();
    }

    receive() external payable {}
}
