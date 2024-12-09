@Aspect
@Component
public class XRayInspector extends BaseAbstractXRayInterceptor {    
    @Override    
    protected Map<String, Map<String, Object>> generateMetadata(ProceedingJoinPoint proceedingJoinPoint, Subsegment subsegment) throws Exception {      
        return super.generateMetadata(proceedingJoinPoint, subsegment);    
    }    
  
  @Override    
  @Pointcut("@within(com.amazonaws.xray.spring.aop.XRayEnabled) && bean(*Controller)")    
  public void xrayEnabledClasses() {}
  
}