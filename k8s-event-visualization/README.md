

## Dashboard 

The steps to deploy this dashboard are as follows:

1. Modify Dockerfile to add your Rockset API key to the account that contains the eventrouter_events collection.
```
docker build -t your_repo/image:tag .
```
2. Build the Dockerfile and push to your secure repository.
3. Replace k8s/deployment.yaml's image placeholder (myrepo/replaceme) with the image you pushed above.
4. Deploy the k8s folder using:

```
kubectl apply -f k8s/
```
5. The service uses the loadbalancer type. If service type of load balancer is supported on your kubernetes
provider, it should expose a service IP. Fetch that and access it using:

```
kubectl get svc
``` 
and access the port 5000 on that external IP.
If you don't have service type of load balancer supported, you may create an appropriate 
ingress resource, or use kubectl port-forward.

```
kubectl port-forward <pod-name> 5000:5000
```
and access the web page over http://localhost:5000.