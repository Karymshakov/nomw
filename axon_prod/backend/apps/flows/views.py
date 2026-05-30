from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import ConversationFlow, FlowCard, FlowConnection, AIFlowMode, AITool, AIModelConfig, ManagerTransferConfig, AgentConfig
from .serializers import (
    ConversationFlowListSerializer,
    ConversationFlowDetailSerializer,
    FlowCardSerializer,
    FlowConnectionSerializer,
    AIFlowModeSerializer,
    AIToolSerializer,
    AIModelConfigSerializer,
    ManagerTransferConfigSerializer,
    AgentConfigSerializer,
)
from apps.organizations.mixins import OrganizationQuerysetMixin


def _get_org(request):
    user = request.user
    if getattr(user, 'is_superadmin', False):
        return None
    org = getattr(user, 'current_organization', None)
    if org is None:
        from rest_framework.exceptions import PermissionDenied
        raise PermissionDenied('No active organization. Please select an organization.')
    return org


class ConversationFlowViewSet(OrganizationQuerysetMixin, viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = ConversationFlow.objects.all()

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ConversationFlowDetailSerializer
        return ConversationFlowListSerializer

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = ConversationFlowDetailSerializer(instance)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        flow = self.get_object()
        flow.is_active = True
        flow.save()
        return Response({'status': 'activated', 'id': flow.pk})


class FlowCardViewSet(OrganizationQuerysetMixin, viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = FlowCard.objects.all()
    serializer_class = FlowCardSerializer

    def get_queryset(self):
        user = self.request.user
        flow_id = self.kwargs.get('flow_pk')
        qs = FlowCard.objects.all()
        if flow_id:
            qs = qs.filter(flow_id=flow_id)
        if not getattr(user, 'is_superadmin', False):
            org = self._get_organization()
            qs = qs.filter(organization=org)
        return qs

    def perform_create(self, serializer):
        user = self.request.user
        flow_id = self.kwargs.get('flow_pk')
        org = None if getattr(user, 'is_superadmin', False) else self._get_organization()
        kwargs = {}
        if flow_id:
            kwargs['flow_id'] = int(flow_id)
        if org:
            kwargs['organization'] = org
        serializer.save(**kwargs)


class FlowConnectionViewSet(OrganizationQuerysetMixin, viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = FlowConnection.objects.all()
    serializer_class = FlowConnectionSerializer

    def get_queryset(self):
        user = self.request.user
        flow_id = self.kwargs.get('flow_pk')
        qs = FlowConnection.objects.all()
        if flow_id:
            qs = qs.filter(flow_id=flow_id)
        if not getattr(user, 'is_superadmin', False):
            org = self._get_organization()
            qs = qs.filter(organization=org)
        return qs

    def perform_create(self, serializer):
        user = self.request.user
        flow_id = self.kwargs.get('flow_pk')
        org = None if getattr(user, 'is_superadmin', False) else self._get_organization()
        kwargs = {}
        if flow_id:
            kwargs['flow_id'] = int(flow_id)
        if org:
            kwargs['organization'] = org
        serializer.save(**kwargs)


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def ai_flow_mode(request):
    org = _get_org(request)
    obj = AIFlowMode.get_mode(org=org)
    if request.method == 'GET':
        return Response(AIFlowModeSerializer(obj).data)
    serializer = AIFlowModeSerializer(obj, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data)


class AIToolViewSet(OrganizationQuerysetMixin, viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = AIToolSerializer
    queryset = AITool.objects.all()
    http_method_names = ['get', 'post', 'patch', 'delete', 'head', 'options']


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def ai_model_config(request):
    org = _get_org(request)
    obj = AIModelConfig.get_config(org=org)
    if request.method == 'GET':
        return Response(AIModelConfigSerializer(obj).data)
    serializer = AIModelConfigSerializer(obj, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data)


class AgentConfigViewSet(OrganizationQuerysetMixin, viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = AgentConfigSerializer
    queryset = AgentConfig.objects.all()
    http_method_names = ['get', 'patch', 'head', 'options']

    @action(detail=True, methods=['get'], url_path=r'context/(?P<lead_id>[0-9]+)')
    def context(self, request, pk=None, lead_id=None):
        """Read-only debug view of a lead's shared agent_context."""
        try:
            from apps.leads.models import Lead
            lead = Lead.objects.only('agent_context').get(pk=lead_id)
            return Response({'lead_id': int(lead_id), 'agent_context': lead.agent_context or {}})
        except Lead.DoesNotExist:
            return Response({'error': 'Lead not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def transfer_config(request):
    org = _get_org(request)
    obj = ManagerTransferConfig.get_config(org=org)
    if request.method == 'GET':
        return Response(ManagerTransferConfigSerializer(obj).data)
    serializer = ManagerTransferConfigSerializer(obj, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data)
