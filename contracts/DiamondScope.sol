// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title DiamondScope
 * @dev On-chain registry for EIP-2535 Diamond inspection requests and diagnostic results.
 * Pure gas-fee only: no protocol or platform fees are charged.
 */
contract DiamondScope {
    struct DiamondRequest {
        uint256 requestId;
        address diamondAddress;
        address requester;
        uint256 timestamp;
        bool isCompleted;
        uint256 facetCount;
        uint256 selectorCount;
        string diagnosticSummary;
    }

    uint256 public requestCount;
    
    // Mapping from Request ID to DiamondRequest
    mapping(uint256 => DiamondRequest) public requests;
    
    // Mapping from Diamond address to list of Request IDs
    mapping(address => uint256[]) private diamondToRequests;
    
    // Mapping from Requester address to list of Request IDs
    mapping(address => uint256[]) private userToRequests;

    // Events
    event DiamondCheckRequested(
        uint256 indexed requestId,
        address indexed diamondAddress,
        address indexed requester,
        uint256 timestamp
    );

    event DiamondCheckPublished(
        uint256 indexed requestId,
        address indexed diamondAddress,
        uint256 facetCount,
        uint256 selectorCount,
        address publisher,
        uint256 timestamp
    );

    /**
     * @notice Initiates a diamond inspection record for a target address.
     * @dev Strictly interacts via gas fee only.
     * @param _diamondAddress Target diamond contract address to inspect.
     * @return requestId Unique identifier for the inspection request.
     */
    function requestDiamondCheck(address _diamondAddress) external returns (uint256 requestId) {
        require(_diamondAddress != address(0), "DiamondScope: Invalid diamond address");
        
        requestCount++;
        requestId = requestCount;

        DiamondRequest storage req = requests[requestId];
        req.requestId = requestId;
        req.diamondAddress = _diamondAddress;
        req.requester = msg.sender;
        req.timestamp = block.timestamp;
        req.isCompleted = false;
        req.facetCount = 0;
        req.selectorCount = 0;
        req.diagnosticSummary = "";

        diamondToRequests[_diamondAddress].push(requestId);
        userToRequests[msg.sender].push(requestId);

        emit DiamondCheckRequested(requestId, _diamondAddress, msg.sender, block.timestamp);
    }

    /**
     * @notice Publishes inspection results and architecture metrics for an existing request.
     * @dev Strictly interacts via gas fee only.
     * @param _requestId Unique ID of the request being published.
     * @param _facetCount Total facets discovered on the diamond.
     * @param _selectorCount Total registered function selectors found.
     * @param _diagnosticSummary Brief diagnostic summary or JSON payload.
     */
    function publishResult(
        uint256 _requestId,
        uint256 _facetCount,
        uint256 _selectorCount,
        string calldata _diagnosticSummary
    ) external {
        require(_requestId > 0 && _requestId <= requestCount, "DiamondScope: Request does not exist");
        DiamondRequest storage req = requests[_requestId];

        req.isCompleted = true;
        req.facetCount = _facetCount;
        req.selectorCount = _selectorCount;
        req.diagnosticSummary = _diagnosticSummary;

        emit DiamondCheckPublished(
            _requestId,
            req.diamondAddress,
            _facetCount,
            _selectorCount,
            msg.sender,
            block.timestamp
        );
    }

    /**
     * @notice Fetches details of a specific inspection request.
     * @param _requestId Unique ID of the inspection request.
     */
    function getRequest(uint256 _requestId) external view returns (DiamondRequest memory) {
        require(_requestId > 0 && _requestId <= requestCount, "DiamondScope: Request does not exist");
        return requests[_requestId];
    }

    /**
     * @notice Returns all request IDs recorded for a given diamond address.
     * @param _diamondAddress Target diamond address.
     */
    function getRequestsByDiamond(address _diamondAddress) external view returns (uint256[] memory) {
        return diamondToRequests[_diamondAddress];
    }

    /**
     * @notice Returns all request IDs initiated by a specific user.
     * @param _user Requester address.
     */
    function getRequestsByUser(address _user) external view returns (uint256[] memory) {
        return userToRequests[_user];
    }

    /**
     * @notice Retrieves the most recent requests up to `_limit`.
     */
    function getRecentRequests(uint256 _limit) external view returns (DiamondRequest[] memory) {
        if (requestCount == 0) {
            return new DiamondRequest[](0);
        }

        uint256 count = _limit > requestCount ? requestCount : _limit;
        DiamondRequest[] memory items = new DiamondRequest[](count);

        for (uint256 i = 0; i < count; i++) {
            uint256 reqId = requestCount - i;
            items[i] = requests[reqId];
        }

        return items;
    }
}

