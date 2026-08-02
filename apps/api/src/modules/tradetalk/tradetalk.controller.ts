import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Req, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { TradeTalkService } from './tradetalk.service';
import { SocialPostService } from './services/social-post.service';
import { SocialFeedService } from './services/social-feed.service';
import { SocialFollowService } from './services/social-follow.service';
import { CreateCommunityDto, UpdateCommunityDto, DiscoverCommunitiesDto, CreateRoomDto, UpdateRoomDto, InviteMemberDto, UpdateMemberRoleDto, JoinCommunityDto, CreatePostDto, UpdatePostDto, PostFilterDto, SendCommentDto, CommentFilterDto, FollowDto, FollowCheckDto, FollowQueryDto } from './dto';
import { CommunityMemberRole, CommunityMemberStatus, SocialPostType, FollowType } from '@prisma/client';

interface RequestWithUser extends Request {
  user: { id: string; companyId?: string; email?: string; roles?: string[] };
}

@ApiTags('TradeTalk')
@Controller('tradetalk')
@UseGuards(AuthGuard('jwt'))
@Throttle({ default: { limit: 60, ttl: 60000 } })
export class TradeTalkController {
  constructor(
    private readonly tradetalkService: TradeTalkService,
    private readonly socialPostService: SocialPostService,
    private readonly socialFeedService: SocialFeedService,
    private readonly socialFollowService: SocialFollowService,
  ) {}

  @Get('categories')
  @ApiOperation({ summary: 'List community categories' })
  @UseGuards(AuthGuard('jwt'))
  listCategories() {
    return this.tradetalkService.listCategories();
  }

  @Get('communities')
  @ApiOperation({ summary: 'Discover communities' })
  @UseGuards(AuthGuard('jwt'))
  discoverCommunities(@Query() query: DiscoverCommunitiesDto) {
    return this.tradetalkService.discoverCommunities(query);
  }

  @Get('communities/:idOrSlug')
  @ApiOperation({ summary: 'Get community by ID or slug' })
  @UseGuards(AuthGuard('jwt'))
  getCommunity(@Param('idOrSlug') idOrSlug: string, @Req() req: RequestWithUser) {
    return this.tradetalkService.getCommunity(idOrSlug, req.user?.id);
  }

  @Get('discover/featured')
  @ApiOperation({ summary: 'Discover featured communities' })
  discoverFeatured(@Query('limit') limit?: number) {
    return this.tradetalkService.discoverFeatured(limit);
  }

  @Get('discover/trending')
  @ApiOperation({ summary: 'Discover trending communities' })
  discoverTrending(@Query('limit') limit?: number) {
    return this.tradetalkService.discoverTrending(limit);
  }

  @Get('discover/recommended')
  @ApiOperation({ summary: 'Discover recommended communities' })
  discoverRecommended(@Req() req: any, @Query('limit') limit?: number) {
    return this.tradetalkService.discoverRecommended(req.user.id, limit);
  }

  @Get('discover/nearby')
  @ApiOperation({ summary: 'Discover nearby communities' })
  discoverNearby(@Req() req: any, @Query('limit') limit?: number) {
    return this.tradetalkService.discoverNearby(req.user.id, limit);
  }

  @Get('discover/industry/:industryId')
  @ApiOperation({ summary: 'Discover communities by industry' })
  discoverByIndustry(@Param('industryId') industryId: string, @Query('limit') limit?: number) {
    return this.tradetalkService.discoverByIndustry(industryId, limit);
  }

  @Get('rankings')
  @ApiOperation({ summary: 'Get community rankings' })
  getRankings(@Query('type') type: string, @Query('limit') limit?: number) {
    return this.tradetalkService.getRankings(type || 'most-active', limit);
  }

  @Get('members/featured')
  @ApiOperation({ summary: 'Get featured members' })
  getFeaturedMembers(@Query('limit') limit?: number) {
    return this.tradetalkService.getFeaturedMembers(limit);
  }

  @Get('members/leaders')
  @ApiOperation({ summary: 'Get community leaders' })
  getCommunityLeaders(@Query('limit') limit?: number) {
    return this.tradetalkService.getCommunityLeaders(limit);
  }

  @Get('dashboard-stats')
  @ApiOperation({ summary: 'Get user dashboard stats' })
  getDashboardStats(@Req() req: any) {
    return this.tradetalkService.getDashboardStats(req.user.id);
  }

  @Get('my-communities')
  @ApiOperation({ summary: 'Get my communities' })
  myCommunities(@Req() req: any) {
    return this.tradetalkService.myCommunities(req.user.id);
  }

  @Get('my-invitations')
  @ApiOperation({ summary: 'Get my pending invitations' })
  myInvitations(@Req() req: any) {
    return this.tradetalkService.myInvitations(req.user.id);
  }

  @Post('communities')
  @ApiOperation({ summary: 'Create a community' })
  createCommunity(@Body() dto: CreateCommunityDto, @Req() req: RequestWithUser) {
    return this.tradetalkService.createCommunity(req.user.id, dto);
  }

  @Patch('communities/:idOrSlug')
  @ApiOperation({ summary: 'Update a community' })
  updateCommunity(@Param('idOrSlug') idOrSlug: string, @Body() dto: UpdateCommunityDto, @Req() req: RequestWithUser) {
    return this.tradetalkService.updateCommunity(idOrSlug, req.user.id, dto);
  }

  @Delete('communities/:idOrSlug')
  @ApiOperation({ summary: 'Delete a community' })
  deleteCommunity(@Param('idOrSlug') idOrSlug: string, @Req() req: RequestWithUser) {
    return this.tradetalkService.deleteCommunity(idOrSlug, req.user.id);
  }

  @Post('communities/:communityId/join')
  @ApiOperation({ summary: 'Join a community' })
  joinCommunity(@Param('communityId') communityId: string, @Body() dto: JoinCommunityDto, @Req() req: RequestWithUser) {
    return this.tradetalkService.joinCommunity(communityId, req.user.id, dto.companyId);
  }

  @Post('communities/:communityId/leave')
  @ApiOperation({ summary: 'Leave a community' })
  leaveCommunity(@Param('communityId') communityId: string, @Req() req: RequestWithUser) {
    return this.tradetalkService.leaveCommunity(communityId, req.user.id);
  }

  @Get('communities/:communityId/members')
  @ApiOperation({ summary: 'List community members' })
  listMembers(
    @Param('communityId') communityId: string,
    @Query('role') role?: CommunityMemberRole,
    @Query('status') status?: CommunityMemberStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.tradetalkService.listMembers(communityId, { role, status, page, limit });
  }

  @Patch('communities/:communityId/members/:userId')
  @ApiOperation({ summary: 'Update member role' })
  updateMemberRole(
    @Param('communityId') communityId: string,
    @Param('userId') targetUserId: string,
    @Body() dto: UpdateMemberRoleDto,
    @Req() req: RequestWithUser,
  ) {
    return this.tradetalkService.updateMemberRole(communityId, targetUserId, req.user.id, dto.role);
  }

  @Delete('communities/:communityId/members/:userId')
  @ApiOperation({ summary: 'Remove community member' })
  removeMember(
    @Param('communityId') communityId: string,
    @Param('userId') targetUserId: string,
    @Req() req: RequestWithUser,
  ) {
    return this.tradetalkService.removeMember(communityId, targetUserId, req.user.id);
  }

  @Post('communities/:communityId/invite')
  @ApiOperation({ summary: 'Invite member to community' })
  inviteMember(@Param('communityId') communityId: string, @Body() dto: InviteMemberDto, @Req() req: RequestWithUser) {
    return this.tradetalkService.inviteMember(communityId, req.user.id, dto);
  }

  @Get('communities/:communityId/invitations')
  @ApiOperation({ summary: 'List community invitations' })
  listInvitations(@Param('communityId') communityId: string, @Req() req: RequestWithUser) {
    return this.tradetalkService.listInvitations(communityId, req.user.id);
  }

  @Post('invitations/:token/accept')
  @ApiOperation({ summary: 'Accept community invitation' })
  acceptInvitation(@Param('token') token: string, @Body() dto: JoinCommunityDto, @Req() req: RequestWithUser) {
    return this.tradetalkService.acceptInvitation(token, req.user.id, dto.companyId);
  }

  @Post('invitations/:token/reject')
  @ApiOperation({ summary: 'Reject community invitation' })
  rejectInvitation(@Param('token') token: string) {
    return this.tradetalkService.rejectInvitation(token);
  }

  @Delete('invitations/:invitationId')
  @ApiOperation({ summary: 'Cancel community invitation' })
  cancelInvitation(@Param('invitationId') invitationId: string, @Body('communityId') communityId: string, @Req() req: RequestWithUser) {
    return this.tradetalkService.cancelInvitation(invitationId, communityId, req.user.id);
  }

  @Post('communities/:communityId/rooms')
  @ApiOperation({ summary: 'Create a community room' })
  createRoom(@Param('communityId') communityId: string, @Body() dto: CreateRoomDto, @Req() req: RequestWithUser) {
    return this.tradetalkService.createRoom(communityId, req.user.id, dto);
  }

  @Get('communities/:communityId/rooms')
  @ApiOperation({ summary: 'List community rooms' })
  listRooms(@Param('communityId') communityId: string) {
    return this.tradetalkService.listRooms(communityId);
  }

  @Patch('communities/:communityId/rooms/:roomId')
  @ApiOperation({ summary: 'Update a community room' })
  updateRoom(@Param('communityId') communityId: string, @Param('roomId') roomId: string, @Body() dto: UpdateRoomDto, @Req() req: RequestWithUser) {
    return this.tradetalkService.updateRoom(communityId, roomId, req.user.id, dto);
  }

  @Delete('communities/:communityId/rooms/:roomId')
  @ApiOperation({ summary: 'Delete a community room' })
  deleteRoom(@Param('communityId') communityId: string, @Param('roomId') roomId: string, @Req() req: RequestWithUser) {
    return this.tradetalkService.deleteRoom(communityId, roomId, req.user.id);
  }

  // ═══ TradeSocial — Post Endpoints ═════════════════════════════════════

  @Post('communities/:communityId/posts')
  @ApiOperation({ summary: 'Create a post in a community' })
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  createPost(@Param('communityId') communityId: string, @Body() dto: CreatePostDto, @Req() req: RequestWithUser) {
    return this.socialPostService.createPost(req.user.id, communityId, dto);
  }

  @Get('communities/:communityId/posts')
  @ApiOperation({ summary: 'List posts in a community (chronological feed)' })
  listPosts(@Param('communityId') communityId: string, @Query() query: PostFilterDto, @Req() req: RequestWithUser) {
    return this.socialFeedService.getCommunityFeed(communityId, req.user.id, query);
  }

  @Get('posts/:id')
  @ApiOperation({ summary: 'Get a single post with details' })
  getPost(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.socialPostService.getPostById(id, req.user.id);
  }

  @Patch('posts/:id')
  @ApiOperation({ summary: 'Update own post' })
  updatePost(@Param('id') id: string, @Body() dto: UpdatePostDto, @Req() req: RequestWithUser) {
    return this.socialPostService.updatePost(id, req.user.id, dto as unknown as Record<string, unknown>);
  }

  @Delete('posts/:id')
  @ApiOperation({ summary: 'Soft-delete own post' })
  deletePost(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.socialPostService.deletePost(id, req.user.id);
  }

  @Post('posts/:id/like')
  @ApiOperation({ summary: 'Like or unlike a post' })
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  toggleLike(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.socialPostService.toggleLike(id, req.user.id);
  }

  @Get('posts/:id/likes')
  @ApiOperation({ summary: 'List users who liked a post' })
  listLikes(@Param('id') id: string, @Query('page') page?: number, @Query('limit') limit?: number) {
    return this.socialPostService.getLikes(id, page, limit);
  }

  @Post('posts/:id/bookmark')
  @ApiOperation({ summary: 'Bookmark or unbookmark a post' })
  toggleBookmark(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.socialPostService.toggleBookmark(id, req.user.id);
  }

  @Post('posts/:id/share')
  @ApiOperation({ summary: 'Share a post (increment counter)' })
  sharePost(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.socialPostService.sharePost(id, req.user?.id);
  }

  @Get('posts/trending')
  @ApiOperation({ summary: 'Get trending posts across communities' })
  trendingPosts(@Req() req: any, @Query('limit') limit?: number) {
    return this.socialFeedService.getTrendingPosts(req.user.id, limit);
  }

  @Post('posts/:id/pin')
  @ApiOperation({ summary: 'Pin or unpin a post (OWNER/ADMIN only)' })
  togglePin(@Param('id') id: string, @Body('pinned') pinned: boolean, @Req() req: RequestWithUser) {
    return this.socialPostService.setPinPost(id, pinned);
  }

  @Get('communities/:communityId/activity')
  @ApiOperation({ summary: 'Get recent community activity' })
  communityActivity(@Param('communityId') communityId: string, @Req() req: RequestWithUser, @Query('limit') limit?: number) {
    return this.tradetalkService.getCommunityActivity(communityId, req.user?.id, limit);
  }

  // ═══ TradeSocial — Comment Endpoints ══════════════════════════════════

  @Post('posts/:id/comments')
  @ApiOperation({ summary: 'Add a comment to a post' })
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  sendComment(@Param('id') id: string, @Body() dto: SendCommentDto, @Req() req: RequestWithUser) {
    return this.socialPostService.sendComment(id, req.user.id, req.user.companyId ?? null, dto.content, dto.replyToId);
  }

  @Get('posts/:id/comments')
  @ApiOperation({ summary: 'List comments on a post (paginated)' })
  listComments(@Param('id') id: string, @Query() query: CommentFilterDto, @Req() req: RequestWithUser) {
    return this.socialPostService.getComments(id, req.user.id, query.page, query.limit);
  }

  @Delete('posts/:id/comments/:messageId')
  @ApiOperation({ summary: 'Delete own comment' })
  deleteComment(@Param('id') id: string, @Param('messageId') messageId: string, @Req() req: RequestWithUser) {
    return this.socialPostService.deleteComment(id, messageId, req.user.id);
  }

  // ═══ TradeSocial — Follow Endpoints ═══════════════════════════════════

  @Post('follow')
  @ApiOperation({ summary: 'Follow a user or company' })
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  follow(@Body() dto: FollowDto, @Req() req: RequestWithUser) {
    return this.socialFollowService.follow(req.user.id, dto.followingId, dto.followingType);
  }

  @Post('unfollow')
  @ApiOperation({ summary: 'Unfollow a user or company' })
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  unfollow(@Body() dto: FollowDto, @Req() req: RequestWithUser) {
    return this.socialFollowService.unfollow(req.user.id, dto.followingId, dto.followingType);
  }

  @Get('follow/check')
  @ApiOperation({ summary: 'Check if following a user or company' })
  checkFollow(@Query() query: FollowCheckDto, @Req() req: RequestWithUser) {
    return this.socialFollowService.isFollowing(req.user.id, query.followingId, query.followingType);
  }

  @Get('follow/followers/:followingId')
  @ApiOperation({ summary: 'Get followers of a user or company' })
  getFollowers(@Param('followingId') followingId: string, @Query() query: FollowQueryDto) {
    return this.socialFollowService.getFollowers(followingId, query.followingType, query.page, query.limit);
  }

  @Get('follow/following/:followerId')
  @ApiOperation({ summary: 'Get who a user is following' })
  getFollowing(@Param('followerId') followerId: string, @Query() query: FollowQueryDto) {
    return this.socialFollowService.getFollowing(followerId, query.followingType, query.page, query.limit);
  }

  @Get('follow/counts/:followingId')
  @ApiOperation({ summary: 'Get follow counts for a user or company' })
  getFollowCounts(@Param('followingId') followingId: string, @Query('type') type?: string) {
    return this.socialFollowService.getFollowCounts(followingId, type as FollowType);
  }
}
