{{/*
Common labels for all resources
*/}}
{{- define "cricket-app.labels" -}}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/instance: {{ .Release.Name }}
helm.sh/chart: {{ .Chart.Name }}-{{ .Chart.Version }}
environment: {{ .Values.global.environment }}
{{- end }}

{{/*
Full image path — handles both ECR and local images
If ecrRegistry is set:   <registry>/<env>-<service>-memecricket:<tag>
If ecrRegistry is empty:  <repository>:<tag>  (for local Minikube)
*/}}
{{- define "cricket-app.image" -}}
{{- if .registry -}}
{{ .registry }}/{{ .environment }}-{{ .repository }}-memecricket:{{ .tag }}
{{- else -}}
{{ .repository }}:{{ .tag }}
{{- end -}}
{{- end }}

{{/*
Namespace
*/}}
{{- define "cricket-app.namespace" -}}
{{ .Values.global.namespace | default "cricket" }}
{{- end }}
