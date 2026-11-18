#if WITH_DEV_AUTOMATION_TESTS
#include "Misc/AutomationTest.h"
#include "Misc/FileHelper.h"
#include "Misc/Paths.h"
#include "RelayOptics.h"

IMPLEMENT_SIMPLE_AUTOMATION_TEST(FSableParityTest,"SableRelay.Optics.Campaign",
    EAutomationTestFlags::EditorContext | EAutomationTestFlags::EngineFilter)

bool FSableParityTest::RunTest(const FString&)
{
    using namespace relay;
    int32 checked=0;
    for(int n=0;n<3;++n)
    {
        auto base=chamber(n); int configs=1, wins=0;
        TestFalse(TEXT("Begins locked"),trace(base).complete(base));
        for(int j=0;j<base.mirrors;++j) configs*=8;
        for(int k=0;k<configs;++k)
        {
            auto c=base; int key=k;
            for(int j=0;j<c.mirrors;++j){ c.m[j].step=key%8; key/=8; }
            if(trace(c).complete(c)) ++wins;
            ++checked;
        }
        TestEqual(TEXT("Exactly one solution"),wins,1);
    }
    TestEqual(TEXT("Configurations covered"),checked,4168);
    TArray<uint8> bytes;
    const bool read=FFileHelper::LoadFileToArray(bytes,*FPaths::Combine(FPaths::ProjectContentDir(),TEXT("Relay/seal.srm")));
    TestTrue(TEXT("Blender rosette available through UFS"),read && bytes.Num()>8 && FMemory::Memcmp(bytes.GetData(),"SRM1",4)==0);
    return true;
}
#endif
