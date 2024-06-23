from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
from .models import Click

@csrf_exempt
def buttonCount(request):
	if request.method == 'POST':
		if (json.loads(request.body).get('action') == 'increm'):
			Click.increment()
		if (json.loads(request.body).get('action') == 'reset'):
			Click.reset()
		count_value = Click.objects.get(id=1).count
		return JsonResponse({'status': 'success', 'count': count_value})
	elif request.method == 'GET':
		count_value = Click.objects.get(id=1).count
		return JsonResponse({'status': 'success', 'count': count_value})
	return JsonResponse({'status': 'failed'}, status=400)
