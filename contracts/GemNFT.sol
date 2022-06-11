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
    mapping(address => uint256) private pointsBalance;

    modifier isOwner(uint256 tokenId) {
        require(msg.sender == ownerOf(tokenId));
        _;
    }

    event TokenMinted(address indexed creator, uint256 tokenId);
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

    constructor() ERC721("Gems Collection", "GEM") {}

    // create a MarketToken
    function createMarketToken(uint256 tokenId, uint256 tokenValue) private {
        require(tokenValue > 0, "Price too low");
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
    function sendTokenToMarket(uint256 tokenId, uint256 tokenValue) public isOwner(tokenId) {
        createMarketToken(tokenId, tokenValue);
        _marketTokensCount.increment();
        if (_marketTokensSold.current() != 0) _marketTokensSold.decrement();
        _transfer(msg.sender, address(this), tokenId);
    }

    // mint a new token
    function mintToken(string calldata tokenURI, uint256 tokenValue) public onlyOwner {
        require(tokenValue > 0, "token value too low");
        uint256 newTokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        
        _safeMint(msg.sender, newTokenId);
        _setTokenURI(newTokenId, tokenURI);

        sendTokenToMarket(newTokenId, tokenValue);
        emit TokenMinted(msg.sender, newTokenId);
    }

    // claim points gained from game play
    function claimPoints(uint256 points) public {
        pointsBalance[msg.sender] += points;
    }

    // buy points 
    function buyPoints(uint256 qty) public payable {
        require(msg.value >= qty * (1 ether / 10), "Funds too low for quantity");
        pointsBalance[msg.sender] += qty;
    }

    // buy token from market
    function buyToken(uint256 tokenId) public {        
        require(msg.sender != marketTokens[tokenId].seller, "Seller cannot buy own token"); 
        require(pointsBalance[msg.sender] >= marketTokens[tokenId].value, "Insufficient points");  
        address payable prevSeller = marketTokens[tokenId].seller;         

        pointsBalance[msg.sender] -= marketTokens[tokenId].value;
        pointsBalance[prevSeller] += marketTokens[tokenId].value;
        marketTokens[tokenId].claimed = true;
        marketTokens[tokenId].owner = payable(msg.sender);
        marketTokens[tokenId].seller = payable(address(0));

        if (_marketTokensCount.current() != 0) _marketTokensCount.decrement();
        _marketTokensSold.increment();
        _transfer(address(this), msg.sender, tokenId);
    }

    // get all tokens user owns
    function getMyTokens() public view returns (uint[] memory) {
        uint256 index;
        uint256 totalTokensCount = _tokenIdCounter.current();
        uint256[] memory myTokens = new uint256[](balanceOf(msg.sender));

        for (uint256 i = 0; i < totalTokensCount;) {
            if (ownerOf(i) == msg.sender) {
                myTokens[index] = i;
                index++;
            }
            ++i;
        }
        return myTokens;
    }

    // get all tokens available for sale in market
    function getAllMarketTokens() public view returns (MarketToken[] memory){
        uint256 unclaimedTokensCount = _marketTokensCount.current() - _marketTokensSold.current();
        uint256 index = 0;

        MarketToken[] memory allMarketTokens = new MarketToken[](unclaimedTokensCount);
        for(uint256 i = 0; i < _marketTokensCount.current();) {
            if (!marketTokens[i].claimed) {
                allMarketTokens[index] = marketTokens[i];
                index++;
            }
            ++i;
        }
        return allMarketTokens;
    }

    // return if `tokenId` is not in market
    function tokenInMarket(uint256 tokenId) public view returns(bool) {
        require(_exists(tokenId), "Operator query for nonexistent token");
        return !marketTokens[tokenId].claimed;
    }

    // get user's points balance
    function getPointsBalance() public view returns(uint256) {
        return pointsBalance[msg.sender];
    }

    // check contract balance
    function contractBalance() public view onlyOwner returns (uint256) {
        return address(this).balance;
    }

    // claim contract funds
    function claimContractFunds() public payable onlyOwner {
        payable(msg.sender).transfer(contractBalance());
    }

    //
    function getTokensLength() public view returns (uint256) {
        return _tokenIdCounter.current();
    }

    receive() external payable {}

}